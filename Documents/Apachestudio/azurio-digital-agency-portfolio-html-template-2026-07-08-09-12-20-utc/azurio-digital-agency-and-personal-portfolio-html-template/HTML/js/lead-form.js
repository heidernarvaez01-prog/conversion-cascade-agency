/* Apache Studio - envío del formulario de contacto al backend (Lovable Cloud) */
(function () {
  "use strict";

  var SUPABASE_URL = "https://thacqstjbzgddhezgdfo.supabase.co";
  var SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWNxc3RqYnpnZGRoZXpnZGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzcwNTMsImV4cCI6MjA4MTIxMzA1M30.fJogbKxVFfGsOJmKu96tmpWYjSvSE7NSKsa5GkvtC18";

  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el && el.value ? el.value.trim() : "";
  }

  function showReply(form) {
    var block = form.closest(".contact") || document;
    var reply = block.querySelector(".form__reply");
    form.classList.add("is-hidden");
    if (reply) reply.classList.add("is-visible");
    setTimeout(function () {
      if (reply) reply.classList.remove("is-visible");
      form.classList.remove("is-hidden");
      form.reset();
    }, 6000);
  }

  function handle(event) {
    var form = event.target;
    if (!form || form.id !== "contact-form") return;

    // Evita que el handler antiguo (mail.php) se ejecute.
    event.preventDefault();
    event.stopPropagation();

    var name = val(form, "Name");
    var email = val(form, "E-mail");
    var phone = val(form, "Phone") || "No proporcionado";
    var company = val(form, "Company") || null;
    var message = val(form, "Message") || null;

    var payload = {
      full_name: name,
      email: email,
      phone: phone,
      brand_name: company,
      problem: message,
      source: "web_form",
      page_path: window.location.pathname
    };

    // n8n (flujo "Notificación Lead - Diagnóstico Digital"): el nodo Sheets
    // mapea body.Name / body.Company / body["E-mail"] / body.Phone / body.Message
    // y el nodo de email usa body.full_name / body.brand_name / etc.
    // Se envían ambos formatos para cubrir los dos nodos.
    var n8nPayload = {
      Name: name,
      "E-mail": email,
      Phone: phone,
      Company: company,
      Message: message,
      full_name: name,
      email: email,
      phone: phone,
      brand_name: company,
      problem: message,
      source: "web_form",
      page_path: window.location.pathname
    };

    // Envío complementario a n8n: si falla, el registro principal se mantiene.
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload)
    }).catch(function (err) {
      console.warn("n8n webhook error:", err);
    });

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    fetch(SUPABASE_URL + "/rest/v1/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error(t); });
        if (window.dataLayer) {
          window.dataLayer.push({ event: "lead_form_submit", form_source: "web_form" });
        }
        showReply(form);
      })
      .catch(function (err) {
        console.error("Lead form error:", err);
        alert("No pudimos enviar tu mensaje. Escríbenos por WhatsApp o a contacto@apachestudio.mx");
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  document.addEventListener("submit", handle, true);
})();
