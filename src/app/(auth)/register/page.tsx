
"use client";

import React, { useState } from "react";
import Input from "@/components/button/textbox";
import Button from "@/components/button/button";
import styles from "./page.module.css";

import { useRegister } from "@/hooks/use/register-hook";

export default function RegisterPage() {
  const { id, setId, pwd, setPwd, submitRegister } = useRegister();

  return (
    <div className = {styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.loginHeader}>회원가입</h1>
        
        <form onSubmit={submitRegister} className = {styles.form}>
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
            <Button type="submit">등록</Button>
          </div>
        </form>
      </div>
    </div>
  );
}