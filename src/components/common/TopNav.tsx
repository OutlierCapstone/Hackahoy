"use client";

import Image from "next/image";
import { useAuth } from "@/components/common/AuthContext";
import styles from "./TopNav.module.css";

export type NavButtonType =
  | "none"
  | "back"
  | "home"
  | "login"
  | "logout"
  | "mypage"
  | "admin";

export type NavButton = {
  type: NavButtonType;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
};

export default function TopNav({
  left = [],
  right = [],
}: {
  left?: NavButton[];
  right?: NavButton[];
}) {
  return (
    <header className={styles.bar}>
      <nav className={styles.inner}>
        <div className={styles.side}>{left.map(renderBtn)}</div>
        <div className={styles.sideRight}>{right.map(renderBtn)}</div>
      </nav>
    </header>
  );
}

function renderBtn(btn: NavButton, idx: number) {
  if (btn.type === "none") return <span key={`none-${idx}`} />;

  if (btn.type === "mypage") {
    return (
      <MyPageBadge
        key={`mypage-${idx}`}
        onClick={btn.onClick}
        disabled={btn.disabled}
      />
    );
  }

  const meta = getMeta(btn.type);

  return (
    <button
      key={`${btn.type}-${idx}`}
      type="button"
      className={styles.iconBtn}
      onClick={btn.onClick}
      disabled={btn.disabled}
      aria-label={meta.label}
    >
      {meta.img ? (
        <Image src={meta.img} alt={meta.label} width={meta.w} height={meta.h} />
      ) : (
        <span className={styles.text}>{meta.label}</span>
      )}
    </button>
  );
}

function MyPageBadge({
  onClick,
  disabled,
}: {
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const { user } = useAuth();

  return (
    <button
      type="button"
      className={styles.badgeBtn}
      onClick={onClick}
      disabled={disabled}
      aria-label="My Page"
    >
      <span className={styles.badgeText}>
        {user?.nickname ?? "PLAYER"} [level {user?.level ?? 1}]
      </span>
    </button>
  );
}

function getMeta(type: NavButtonType): {
  label: string;
  img?: string;
  w: number;
  h: number;
} {
  switch (type) {
    case "home":
      return { label: "HOME", img: "/assets/ui/home.png", w: 96, h: 42 };
    case "logout":
      return { label: "LOGOUT", img: "/assets/ui/logout.png", w: 140, h: 46 };
    case "back":
      return { label: "BACK", img: "/assets/ui/back.png", w: 96, h: 42 };
    case "login":
      return { label: "LOGIN", img: "/assets/ui/login.png", w: 140, h: 42 };
    case "admin":
      return { label: "ADMIN", img: "/assets/ui/admin.png", w: 140, h: 42 };
    case "mypage":
      return { label: "MYPAGE", w: 0, h: 0 };
    default:
      return { label: "", w: 0, h: 0 };
  }
}
