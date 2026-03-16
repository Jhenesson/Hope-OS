import { getSupabaseClient } from '../lib/supabaseClient';

export const sendWhatsAppMessage = async (
    phone: string, 
    message: string, 
    method: 'browser' | 'extension' | 'api' = 'browser',
    image?: string // Base64 image
): Promise<boolean> => {
    let cleanNumber = phone.replace(/\D/g, '');
    
    // Forçar o código do país 55 se não estiver presente (para números brasileiros)
    // Números brasileiros sem DDI têm 10 ou 11 dígitos
    if (cleanNumber.length >= 10 && cleanNumber.length <= 11 && !cleanNumber.startsWith('55')) {
        cleanNumber = '55' + cleanNumber;
    }
    
    if (method === 'api') {
        try {
            // Get current state from localStorage to get API config
            const storageData = localStorage.getItem('hope-os-storage-v1');
            const appState = storageData ? JSON.parse(storageData) : {};
            
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chatId: `${cleanNumber}@c.us`,
                    text: message,
                    image: image,
                    apiUrl: appState.whatsappApiUrl,
                    apiKey: appState.whatsappApiKey
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || result.message || 'Erro ao enviar mensagem via API');
            }
            
            if (result._warning) {
                console.warn('WhatsApp API Warning:', result._warning);
                // Only alert if it's a fallback warning
                if (result._fallback) {
                    alert('⚠️ Aviso: ' + result._warning);
                }
            }
            
            return true;
        } catch (err: any) {
            console.error('Erro ao enviar via API:', err);
            alert('Erro ao enviar mensagem via API: ' + err.message);
            return false;
        }
    } else if (method === 'extension') {
        const supabase = getSupabaseClient();
        if (!supabase) {
            alert('Configure o banco de dados Supabase nas Configurações primeiro para usar a extensão.');
            return false;
        }
        
        try {
            const { error } = await supabase.from('whatsapp_outbox').insert({
                phone: cleanNumber,
                message: message,
                status: 'pending'
            });
            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error('Erro ao enviar para outbox:', err);
            alert('Erro ao enviar mensagem via extensão: ' + err.message);
            return false;
        }
    } else {
        const encodedText = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanNumber}?text=${encodedText}`, '_blank');
        return true;
    }
};
