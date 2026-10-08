import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificacionPayload {
  radicado: string;
  correo: string;
  nombre: string;
  cedula: string;
  telefono: string;
  direccion: string;
  descripcion: string;
  documentos: Array<{
    file_name: string;
    file_type: string;
    file_size: number;
    created_at: string;
  }>;
  seguimientoUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildEmailHtml(payload: NotificacionPayload): string {
  const docsRows = payload.documentos.length > 0
    ? payload.documentos.map((d, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${d.file_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${d.file_type || 'N/A'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${formatBytes(d.file_size)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${new Date(d.created_at).toLocaleString('es-CO')}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#888;">Sin documentos adjuntos</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0f172a;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">LEXACASO</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">Confirmacion de recepcion de caso</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;color:#475569;font-size:15px;">Estimado/a <strong>${payload.nombre}</strong>,</p>
      <p style="margin:0 0 16px;color:#475569;font-size:15px;">Hemos recibido su caso correctamente. A continuacion encontrara todos los detalles del registro:</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Numero de radicado</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#2563eb;letter-spacing:0.5px;">${payload.radicado}</p>
      </div>
      <h2 style="margin:24px 0 12px;font-size:16px;color:#334155;">Resumen de datos</h2>
      <table style="width:100%;font-size:14px;color:#475569;">
        <tr><td style="padding:6px 0;font-weight:600;color:#64748b;width:140px;">Nombre:</td><td style="padding:6px 0;">${payload.nombre}</td></tr>
        ${payload.cedula ? `<tr><td style="padding:6px 0;font-weight:600;color:#64748b;">Cedula:</td><td style="padding:6px 0;">${payload.cedula}</td></tr>` : ''}
        ${payload.telefono ? `<tr><td style="padding:6px 0;font-weight:600;color:#64748b;">Telefono:</td><td style="padding:6px 0;">${payload.telefono}</td></tr>` : ''}
        ${payload.direccion ? `<tr><td style="padding:6px 0;font-weight:600;color:#64748b;">Direccion:</td><td style="padding:6px 0;">${payload.direccion}</td></tr>` : ''}
        <tr><td style="padding:6px 0;font-weight:600;color:#64748b;">Correo:</td><td style="padding:6px 0;">${payload.correo}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;color:#64748b;vertical-align:top;">Descripcion:</td><td style="padding:6px 0;white-space:pre-wrap;">${payload.descripcion || 'N/A'}</td></tr>
      </table>
      <h2 style="margin:24px 0 12px;font-size:16px;color:#334155;">Documentos adjuntos (${payload.documentos.length})</h2>
      <table style="width:100%;font-size:13px;color:#475569;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">#</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">Nombre</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">Formato</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">Tamano</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">Fecha</th>
          </tr>
        </thead>
        <tbody>${docsRows}</tbody>
      </table>
      <div style="margin:24px 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
        <h2 style="margin:0 0 8px;font-size:16px;color:#15803d;">Seguimiento en tiempo real</h2>
        <p style="margin:0 0 12px;color:#475569;font-size:14px;">Puede consultar el estado de su caso en cualquier momento utilizando el siguiente enlace:</p>
        <a href="${payload.seguimientoUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Consultar estado de mi caso</a>
        <p style="margin:8px 0 0;color:#64748b;font-size:12px;">O copie y pegue este enlace: ${payload.seguimientoUrl}</p>
      </div>
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;padding-top:16px;">
        Este es un correo automatico. No responda a esta direccion.
      </p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: NotificacionPayload = await req.json();

    if (!payload.radicado || !payload.correo) {
      return new Response(
        JSON.stringify({ error: "radicado and correo are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const emailHtml = buildEmailHtml(payload);
    const asunto = `LEXACASO — Caso ${payload.radicado} recibido`;

    // Look up the caso to get its ID for the notification record
    const { data: casoRow } = await supabaseClient
      .from("casos")
      .select("id, user_id")
      .eq("radicado", payload.radicado)
      .maybeSingle();

    let estado = "pendiente";
    let errorMsg = "";

    // Try to send via Resend if API key is configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const { error: sendError } = await resend.emails.send({
          from: "LEXACASO <notificaciones@lexacaso.com>",
          to: payload.correo,
          subject: asunto,
          html: emailHtml,
        });
        if (sendError) {
          estado = "fallida";
          errorMsg = sendError.message;
        } else {
          estado = "enviada";
        }
      } catch (err) {
        estado = "fallida";
        errorMsg = String(err);
      }
    } else {
      estado = "pendiente";
      errorMsg = "RESEND_API_KEY not configured";
    }

    // Always store the notification record
    await supabaseClient.from("notificaciones").insert({
      caso_id: casoRow?.id || null,
      user_id: casoRow?.user_id || null,
      radicado: payload.radicado,
      destinatario: payload.correo,
      asunto,
      cuerpo_html: emailHtml,
      estado,
      error_mensaje: errorMsg,
    });

    return new Response(
      JSON.stringify({
        success: true,
        estado,
        message: estado === "enviada"
          ? "Notificacion enviada por correo"
          : estado === "pendiente"
          ? "Notificacion registrada (pendiente de envio por correo)"
          : "Notificacion registrada con error de envio",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
