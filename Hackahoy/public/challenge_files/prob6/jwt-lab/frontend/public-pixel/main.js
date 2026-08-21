// =====================
// 공통 로그아웃
// =====================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index";
}

// =====================
// DOM 준비되면 실행
// =====================
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  let payload = {};

  if (token) {
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      console.warn("Invalid token payload");
    }
  }

  // ===== 요소 선언 =====
  const profile = document.getElementById("user-profile");
  const loginBtn = document.getElementById("loginBtn");
  const accessionBtn = document.getElementById("accessionBtn");
  const usd = document.getElementById("USD");
  const logoutBtn = document.getElementById("logout");
  const userProfile = document.getElementById("user-profile");
  const profileMenu = document.getElementById("profileMenu");

  // ===== 사용자 이름 표시 =====
  const userNameEls = document.querySelectorAll("#user-name, #dash-user-name");
  userNameEls.forEach((el) => {
    el.textContent = payload?.name || "";
  });

  // ===== 로그인 상태에 따라 UI 표시 =====
  const toggleDisplay = (el, show) => {
    if (el) el.style.display = show ? "inline-block" : "none";
  };

  const isLoggedIn = !!token;
  toggleDisplay(profile, isLoggedIn);
  toggleDisplay(loginBtn, !isLoggedIn);
  toggleDisplay(accessionBtn, !isLoggedIn);
  toggleDisplay(usd, !isLoggedIn);
  toggleDisplay(logoutBtn, isLoggedIn);

  logoutBtn?.addEventListener("click", logout);
  document.getElementById("logout-btn")?.addEventListener("click", logout);

  // ===== 로그인 모달 처리 =====
  const loginModal = document.getElementById("loginModal");
  document.getElementById("loginBtn")?.addEventListener("click", () => {
    if (loginModal) loginModal.style.display = "block";
  });
  // All .close-btn buttons close the modal they belong to.
  // querySelector (singular) only bound the first X in the document, so the
  // signup modal X did nothing. Backdrop click also only handled loginModal and
  // there was no Esc, so the signup modal could not be closed at all.
  document.querySelectorAll(".close-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) modal.style.display = "none";
    }),
  );

  // Esc also closes any open modal.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal").forEach((modal) => {
      if (getComputedStyle(modal).display !== "none") modal.style.display = "none";
    });
  });
  // Backdrop click closes whichever modal was clicked, not just loginModal.
  window.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });

  // ===== 회원가입 모달 =====
  document.querySelectorAll(".signup-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const signupModal = document.getElementById("signupModal");
      if (signupModal) signupModal.style.display = "block";
    }),
  );

  // ===== 회원가입 처리 (서버 연동) =====
  document.getElementById("signup-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const name = document.getElementById("signup-name").value.trim();

    fetch("/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
          document.getElementById("signupModal").style.display = "none";
        } else {
          alert(data.error || "회원가입 실패");
        }
      })
      .catch((err) => {
        console.error("회원가입 오류", err);
      });
  });

  // ===== 로그인 처리 =====
  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          alert("로그인 성공!");
          document.getElementById("loginModal").style.display = "none";
          window.location.href = "dashboard";
        } else {
          alert(data.error || "로그인 실패");
        }
      })
      .catch((err) => {
        console.error("로그인 오류", err);
      });
  });

  // ===== 드롭다운 =====
  userProfile?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (profileMenu)
      profileMenu.style.display =
        profileMenu.style.display === "block" ? "none" : "block";
  });
  profileMenu?.addEventListener("click", (e) => e.stopPropagation());
  window.addEventListener("click", () => {
    if (profileMenu) profileMenu.style.display = "none";
  });

  // =====================
  // 대시보드 기능
  // =====================
  if (window.location.pathname.includes("dashboard")) {
    if (!token) {
      alert("로그인이 필요합니다.");
      window.location.href = "index";
      return;
    }

    //관리자일 때만 /admin 요청
    if (payload.role === "admin") {
      fetch("/admin", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.flag) {
            const adminPanel = document.getElementById("dash-admin-panel");
            if (adminPanel) adminPanel.style.display = "block";

            const escape = (s) =>
              s.replace(
                /[&<>'"]/g,
                (c) =>
                  ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    '"': "&quot;",
                  })[c],
              );
            const resultBox = document.getElementById("admin-result");
            resultBox.innerHTML = `
            <strong>Logged in as:</strong> ${escape(data.user.name)} (${escape(
              data.user.email,
            )})<br><br>
            <strong>Flag:</strong> ${escape(data.flag)}
            `;
          }
        })
        .catch((err) => {
          console.warn("관리자 아님 또는 인증 실패", err);
        });
    }

    // 태스크 등록
    document
      .getElementById("create-task-btn")
      ?.addEventListener("click", () => {
        document.getElementById("taskModal").style.display = "block";
      });

    document
      .getElementById("close-task-modal")
      ?.addEventListener("click", () => {
        document.getElementById("taskModal").style.display = "none";
      });

    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("taskModal")) {
        document.getElementById("taskModal").style.display = "none";
      }
    });

    document.getElementById("taskForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const description = document.getElementById("description").value.trim();
      const taskMessage = document.getElementById("taskMessage");

      if (!title || !description) {
        taskMessage.textContent = "모든 항목을 입력해주세요.";
        return;
      }

      const escape = (s) =>
        s.replace(
          /[&<>'"]/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              "'": "&#39;",
              '"': "&quot;",
            })[c],
        );

      const li = document.createElement("li");
      li.innerHTML = `<strong>${escape(title)}</strong>: ${escape(
        description,
      )}`;
      document.getElementById("taskItems").appendChild(li);
      document.getElementById("taskForm").reset();
      document.getElementById("taskModal").style.display = "none";

      const tasks = [...document.querySelectorAll("#taskItems li")].map(
        (li) => li.textContent,
      );
      localStorage.setItem("tasks_current", JSON.stringify(tasks));
    });

    // 저장된 태스크 로딩
    const saved = JSON.parse(localStorage.getItem("tasks_current") || "[]");
    saved.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      document.getElementById("taskItems").appendChild(li);
    });
  }
});
