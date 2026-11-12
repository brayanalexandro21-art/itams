import {
  AlertTriangle, Archive, Award, BarChart3, Bell, BookOpen, Bot, Briefcase, Building2, CalendarDays, Camera,
  CheckCircle2, CheckSquare, CircleDot, Clapperboard, ClipboardList, Clock, Coins, Crown, Download, Eye, Factory,
  FileText, Flame, Folder, Gamepad2, Globe, Hand, Handshake, Hash, Hourglass, Image, Info, Keyboard, KeyRound,
  Languages, Laptop, LayoutGrid, Lightbulb, LockKeyhole, LogOut, Mail, Medal, Megaphone, MessageSquare, Mic,
  Monitor, Newspaper, Palette, PartyPopper, Pencil, PieChart, Pin, Plug, Plus, Radio, RefreshCw, Rocket,
  Save, ScrollText, Search, Send, Settings, Shield, ShieldCheck, ShoppingCart, Siren, SkipForward, Smartphone,
  Sparkles, Star, Tag, ThumbsUp, Ticket, Timer, Trash2, TrendingDown, TrendingUp, Trophy, User, UserCog, Users, Video,
  Wrench, XCircle, Zap, HeartPulse, HelpCircle, Link2, Circle, Upload, ScanBarcode, Database,
} from 'lucide-react';

// Cada emoji heredado (de las páginas o del backend) se muestra como un ícono de línea del tema.
const MAPA = {
  '📊': BarChart3, '⚠': AlertTriangle, '📋': ClipboardList, '🔔': Bell, 'ℹ': Info, '✅': CheckCircle2, '🎨': Palette,
  '⏱': Timer, '🗑': Trash2, '⚡': Zap, '💡': Lightbulb, '❌': XCircle, '💻': Laptop, '📜': ScrollText, '🌐': Globe,
  '💬': MessageSquare, '📝': FileText, '📧': Mail, '⚙': Settings, '➕': Plus, '✏': Pencil, '📌': Pin, '🤖': Bot,
  '📈': TrendingUp, '👍': ThumbsUp, '💾': Save, '📸': Camera, '📷': Camera, '🏥': HeartPulse, '📥': Download,
  '📱': Smartphone, '📄': FileText, '📐': LayoutGrid, '🌍': Languages, '👥': Users, '🔗': Link2, '🎫': Ticket,
  '🔑': KeyRound, '👨‍💼': UserCog, '⭐': Star, '📹': Video, '🎤': Mic, '🔥': Flame, '📢': Megaphone,
  '🛡': ShieldCheck, '📅': CalendarDays, '🖥': Monitor, '🏷': Tag, '🗄': Archive, '📉': TrendingDown, '📘': BookOpen,
  '📁': Folder, '📣': Megaphone, '🚨': Siren, '🏆': Trophy, '🏅': Medal, '🔌': Plug, '🎮': Gamepad2, '✈': Send,
  '👁': Eye, '💱': Coins, '👤': User, '🚀': Rocket, '🛒': ShoppingCart, '🔐': LockKeyhole, '🔍': Search,
  '🔒': Shield, '❓': HelpCircle, '🔄': RefreshCw, '🚪': LogOut, '🏢': Building2, '🎥': Clapperboard,
  '💼': Briefcase, '🖼': Image, '⏰': Clock, '🔴': CircleDot, '🏭': Factory, '🔢': Hash, '☑': CheckSquare,
  '📚': BookOpen, '📰': Newspaper, '🥧': PieChart, '🍩': PieChart, '🔘': CircleDot, '🦸': Award, '🤝': Handshake,
  '👑': Crown, '🦾': Wrench, '👋': Hand, '⌨': Keyboard, '📡': Radio, '🔧': Wrench, '⏳': Hourglass,
  '⏭': SkipForward, '🎉': PartyPopper, '📦': Archive, '📤': Upload, '🧾': ScanBarcode, '🗃': Database, '✨': Sparkles,
};

// Colores con significado; el resto usa el azul de la marca.
const TONOS = { '✅': 'text-emerald-600', '❌': 'text-red-600', '⚠': 'text-amber-500', '🚨': 'text-red-600', '🔴': 'text-red-600', '⭐': 'text-amber-500', '🔥': 'text-orange-500' };

const EMOJI_RE = /\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}️?)*/gu;
const limpiar = (e) => String(e ?? '').replace(/️/g, '').trim();

export const sinEmoji = (texto) => String(texto ?? '').replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();

export function Icono({ e, className = 'h-5 w-5', tono }) {
  const clave = limpiar(e);
  if (!clave) return null;
  const Comp = MAPA[clave] || (/\p{Extended_Pictographic}/u.test(clave) ? Circle : null);
  if (!Comp) return <span>{e}</span>; // no es un emoji: se muestra tal cual
  return <Comp className={`inline-block shrink-0 align-[-0.2em] ${className} ${tono ?? TONOS[clave] ?? 'text-brand-600'}`} strokeWidth={1.8} aria-hidden="true" />;
}

// Ícono grande en recuadro de color para el título de la página.
export function IconoTitulo({ e }) {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
      <Icono e={e} className="h-5 w-5" tono="text-brand-600" />
    </span>
  );
}
