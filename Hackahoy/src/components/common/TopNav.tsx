"use client";

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
      <nav
        className={`${styles.inner} ${
          left.some((btn) => btn.type === "back") ? styles.hasBack : ""
        }`}
      >
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

  const label = getLabel(btn.type);

  return (
    <button
      key={`${btn.type}-${idx}`}
      type="button"
      className={`pixel-btn pixel-btn--sm ${styles.navPixelBtn} ${
        btn.type === "home" ? styles.homeBtn : ""
      }`}
      onClick={btn.onClick}
      disabled={btn.disabled}
      aria-label={label}
    >
      <span className={styles.navButtonText}>{label}</span>
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
        {user?.nickname ?? "PLAYER"} [level {user?.levelNum ?? 1}]
      </span>
    </button>
  );
}

function getLabel(type: NavButtonType): string {
  switch (type) {
    case "home":
      return "HOME";
    case "logout":
      return "LOGOUT";
    case "back":
      return "BACK";
    case "login":
      return "LOGIN";
    case "admin":
      return "ADMIN";
    case "mypage":
      return "MYPAGE";
    default:
      return "";
  }
}
