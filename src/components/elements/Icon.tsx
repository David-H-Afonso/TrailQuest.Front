import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Award, BookOpen,
  CalendarDays, Check, ChevronRight, CircleHelp, Compass, Flag, FlaskConical,
  Footprints, Leaf, LoaderCircle, LockKeyhole, Map, MapPin, Menu, Mountain,
  Navigation, Plus, RefreshCw, RotateCcw, Settings2, ShieldCheck, Signpost,
  Sparkles, Sun, Watch, X, Activity, HeartPulse, Dumbbell, Users, Moon, Share2, KeyRound, Image, ChevronLeft, ChevronDown, Upload,
} from 'lucide-react';

const icons = {
  download: ArrowDownToLine, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight, award: Award, book: BookOpen, calendar: CalendarDays,
  check: Check, chevron: ChevronRight, help: CircleHelp, compass: Compass, flag: Flag,
  flask: FlaskConical, footprints: Footprints, leaf: Leaf, loader: LoaderCircle,
  lock: LockKeyhole, map: Map, 'map-pin': MapPin, menu: Menu, mountain: Mountain,
  navigation: Navigation, plus: Plus, refresh: RefreshCw, reset: RotateCcw,
  settings: Settings2, shield: ShieldCheck, signpost: Signpost, sparkles: Sparkles,
  sun: Sun, watch: Watch, close: X,
  activity: Activity, heart: HeartPulse, strength: Dumbbell, users: Users, moon: Moon, share: Share2,
  key: KeyRound, image: Image, 'chevron-left': ChevronLeft, 'chevron-down': ChevronDown, upload: Upload,
};

export type IconName = keyof typeof icons;

export function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const Component = icons[name as IconName] ?? Compass;
  return <Component aria-hidden="true" size={size} strokeWidth={1.8} className={className} />;
}
