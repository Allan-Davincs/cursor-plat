import { useEffect, useMemo, useState } from "react";
import { MessageCircle, QrCode } from "lucide-react";
import { getWhatsAppQr } from "../api/client";

const defaultPhone = "15550001111";

const fallbackData = (phone, text) => {
  const chatUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  return {
    chatUrl,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(chatUrl)}`,
  };
};

function WhatsAppQR({
  phone = defaultPhone,
  text = "Hi InfoX, I need shopping help.",
  compact = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [qrData, setQrData] = useState(() => fallbackData(phone, text));

  const buttonLabel = useMemo(
    () => (compact ? "Chat" : "WhatsApp Support"),
    [compact],
  );

  useEffect(() => {
    let mounted = true;
    const loadQr = async () => {
      try {
        const data = await getWhatsAppQr({ phone, text });
        if (mounted) {
          setQrData(data);
        }
      } catch {
        if (mounted) {
          setQrData(fallbackData(phone, text));
        }
      }
    };
    loadQr();
    return () => {
      mounted = false;
    };
  }, [phone, text]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <MessageCircle size={16} />
        <span className={compact ? "hidden sm:inline" : ""}>{buttonLabel}</span>
        <QrCode size={14} />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-72 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Scan to chat on WhatsApp
          </p>
          <img
            src={qrData.qrImageUrl}
            alt="WhatsApp chat QR code"
            className="mt-3 w-full rounded-xl border border-zinc-100 dark:border-zinc-700"
          />
          <a
            href={qrData.chatUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-xl bg-emerald-500 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Open Chat
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default WhatsAppQR;
