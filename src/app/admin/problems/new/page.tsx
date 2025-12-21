"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./new.module.css";

export default function AdminCreateProblemPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flag, setFlag] = useState("");
  const [server, setServer] = useState("");

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ title, description, flag, server });
    alert("CREATE PROBLEM (데모): 콘솔 확인");
  };

  return (
    <section className={styles.stage}>
      <div className={styles.board}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.push("/admin")}
          aria-label="close"
          title="Close"
        >
          ✕
        </button>

        <h1 className={styles.title}>Create Problem</h1>

        <form className={styles.form} onSubmit={onCreate}>
          <div className={styles.field}>
            <div className={styles.label}>Title</div>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문제 제목"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Description</div>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문제 설명"
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <div className={styles.label}>Flag</div>
              <input
                className={styles.input}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="flag{enter_your_flag}"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Server</div>
              <input
                className={styles.input}
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="https://localhost"
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="submit"
              className={styles.imgBtn}
              aria-label="CREATE PROBLEM"
            >
              <Image
                src="/assets/ui/createproblem.png"
                alt="CREATE PROBLEM"
                width={170}
                height={64}
                priority
              />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
