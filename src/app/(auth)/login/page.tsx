"use client";

import React, { useState } from "react";
import Link from "next/link";
import Input from "@/components/button/textbox";
import Button from "@/components/button/button";
import styles from "./page.module.css";

import { useLogin } from "@/hooks/use/login-hook";

export default function LoginPage() {
  const { id, setId, pwd, setPwd, submitLogin } = useLogin();

  return (
    <div className = {styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.loginHeader}>로그인</h1>
        
        <form onSubmit={submitLogin} className = {styles.form}>
          <Input 
              id="login-id"
              value={id} 
              onChange={(e) => setId(e.target.value)} 
              placeholder="아이디 입력"
          />
          <Input 
              id="login-pwd" 
              type="password" 
              value={pwd} 
              onChange={(e) => setPwd(e.target.value)} 
              placeholder="비밀번호 입력"
          />
          
          <div className={styles.buttonGroup}>
            <Button type="submit">로그인</Button>
          </div>
          <Link href="/register" className={styles.signupLink}>
              회원가입
          </Link>

        </form>
      </div>
    </div>
  );
}