import type { LucideIcon } from "lucide-react";
import {
  Home,
  BookOpen,
  Headphones,
  PenLine,
  ClipboardList,
  BarChart3,
  Settings,
  Users,
  GraduationCap,
  FolderOpen,
  LifeBuoy,
  MessageSquare,
  Baby,
  Sparkles,
  Building2,
  ShieldCheck,
  Megaphone,
} from "lucide-react";

import type { UserRole } from "@/lib/types/database";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  student: [
    { label: "Home", href: "/student", icon: Home },
    { label: "My Learning", href: "/student/learning", icon: BookOpen },
    { label: "Practice", href: "/student/practice", icon: Sparkles },
    { label: "Assignments", href: "/student/assignments", icon: ClipboardList },
    { label: "Progress", href: "/student/progress", icon: BarChart3 },
    { label: "Settings", href: "/student/settings", icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: Home },
    { label: "Classes", href: "/teacher/classes", icon: GraduationCap },
    { label: "Students", href: "/teacher/students", icon: Users },
    { label: "Resources", href: "/teacher/resources", icon: FolderOpen },
    { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    { label: "Progress", href: "/teacher/progress", icon: BarChart3 },
    { label: "Messages", href: "/teacher/messages", icon: MessageSquare },
    { label: "Settings", href: "/teacher/settings", icon: Settings },
  ],
  parent: [
    { label: "Home", href: "/parent", icon: Home },
    { label: "Children", href: "/parent/children", icon: Baby },
    { label: "Progress", href: "/parent/progress", icon: BarChart3 },
    { label: "Activities", href: "/parent/activities", icon: LifeBuoy },
    { label: "Messages", href: "/parent/messages", icon: MessageSquare },
    { label: "Resources", href: "/parent/resources", icon: FolderOpen },
    { label: "Settings", href: "/parent/settings", icon: Settings },
  ],
  school_admin: [
    { label: "Overview", href: "/school", icon: Home },
    { label: "Students", href: "/school/students", icon: Users },
    { label: "Teachers", href: "/school/teachers", icon: GraduationCap },
    { label: "Classes", href: "/school/classes", icon: Building2 },
    { label: "Resources", href: "/school/resources", icon: FolderOpen },
    { label: "Analytics", href: "/school/analytics", icon: BarChart3 },
    { label: "Announcements", href: "/school/announcements", icon: Megaphone },
    { label: "Settings", href: "/school/settings", icon: ShieldCheck },
  ],
};

export const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  parent: "Parent",
  teacher: "Teacher",
  school_admin: "School Admin",
};

export const ROLE_HOME: Record<UserRole, string> = {
  student: "/student",
  parent: "/parent",
  teacher: "/teacher",
  school_admin: "/school",
};
