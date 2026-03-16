
import React from 'react';
import { WhatsAppIcon } from './icons/Icons';
import { useAppContext } from '../context/AppContext';
import { sendWhatsAppMessage } from '../utils/whatsapp';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
  label?: string;
  variant?: 'icon' | 'full';
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ 
  phone, 
  message = "Olá! Gostaria de falar sobre o HOPE OS.", 
  className = "",
  label = "WhatsApp",
  variant = 'full'
}) => {
  const { appState } = useAppContext();

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Ensure it has country code (default to 55 for Brazil if not present)
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    await sendWhatsAppMessage(finalPhone, message, appState.whatsappSendMethod);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={`p-2 rounded-full hover:bg-green-50 text-green-600 transition-colors ${className}`}
        title="Enviar mensagem no WhatsApp"
      >
        <WhatsAppIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-sm active:scale-95 ${className}`}
    >
      <WhatsAppIcon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
};
