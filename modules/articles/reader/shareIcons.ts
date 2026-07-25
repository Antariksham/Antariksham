import { Twitter, Facebook, Linkedin, MessageCircle, Send, Mail, type LucideIcon } from 'lucide-react'
import type { ShareTargetKey } from './shareLinks'

/**
 * Icon for each share channel, shared by the desktop share rail and the mobile
 * share fallback menu. lucide 0.383 still ships the brand marks; WhatsApp and
 * Telegram have no brand icon, so a chat bubble / paper-plane stand in.
 */
export const SHARE_ICONS: Record<ShareTargetKey, LucideIcon> = {
  x:        Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  telegram: Send,
  email:    Mail,
}
