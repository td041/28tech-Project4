import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  update,
  remove,
  onChildAdded,
  get,
  child,
  onChildRemoved,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
// Import authentication
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// Thư viện PopperJS
import * as Popper from "https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js";
// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyDtputm7vY8T7PA3v9IyKnUWdUOKPKWI3A",
  authDomain: "fir-99b9e.firebaseapp.com",
  databaseURL: "https://fir-99b9e-default-rtdb.firebaseio.com",
  projectId: "fir-99b9e",
  storageBucket: "fir-99b9e.appspot.com",
  messagingSenderId: "988477661424",
  appId: "1:988477661424:web:8cd07e7425a7d8b6176235",
  measurementId: "G-0Y6KEYBJH4",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);
const dbRef = ref(getDatabase());
let userCurrent = null;
const chatsRef = ref(db, "chats");

// Hàm hiển thị thông báo
const showAlert = (content = null, time = 3000) => {
  if (content) {
    const newAlert = document.createElement("div"); // Tạo một div thông báo mới
    newAlert.setAttribute("class", "alert alert--success"); // Đặt class cho thông báo

    // Đặt nội dung HTML cho thông báo
    newAlert.innerHTML = `
        <span class="alert__content">${content}</span>
        <span class="alert__close"><i class="fa-solid fa-xmark"></i></span>
    `;
    const alertList = document.querySelector(".alert-list"); // Lấy phần tử danh sách thông báo

    alertList.appendChild(newAlert); // Thêm thông báo mới vào danh sách
    const alertClose = newAlert.querySelector(".alert__close"); // Lấy nút đóng thông báo
    alertClose.addEventListener("click", () => {
      alertList.removeChild(newAlert); // Xóa thông báo khi nút đóng được nhấn
    });

    // Tự động xóa thông báo sau thời gian chỉ định
    setTimeout(() => {
      alertList.removeChild(newAlert);
    }, time);
  }
};
// Trang đăng kí
const formRegister = document.querySelector("#form-register");
if (formRegister) {
  formRegister.addEventListener("submit", (event) => {
    event.preventDefault();
    const fullName = formRegister.fullName.value;
    const email = formRegister.email.value;
    const password = formRegister.password.value;
    if (fullName && email && password) {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed up
          const user = userCredential.user;
          if (user) {
            set(ref(db, `users/${user.uid}`), {
              fullName: fullName,
            }).then(() => {
              window.location.href = "login.html";
            });
          }
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          showAlert("Email đã tồn tại trong hệ thống!", 5000, "alert--error");
        });
    }
  });
}
// Trang đăng nhập
const formLogin = document.querySelector("#form-login");
if (formLogin) {
  formLogin.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = formLogin.email.value;
    const password = formLogin.password.value;
    if (email && password) {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed up
          const user = userCredential.user;
          if (user) {
            window.location.href = "index.html";
          }
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          showAlert("Email hoặc mật khẩu không chính xác!", 5000, "alert--error");
        });
    }
  });
}
// Đăng xuất
const buttonLogout = document.querySelector("[button-logout]");
if (buttonLogout) {
  buttonLogout.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.log(error);
      });
  });
}
// Kiểm tra trạng thái đăng nhập
const buttonLogin = document.querySelector("[button-login]");
const buttonRegister = document.querySelector("[button-register]");
const chat = document.querySelector(".chat");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // console.log(user.email);
    userCurrent = user;
    buttonLogout.style.display = "inline";
    chat.style.display = "block";
  } else {
    buttonLogin.style.display = "inline";
    buttonRegister.style.display = "inline";
    if (chat) {
      chat.innerHTML = `<i>Vui lòng đăng nhập để sử dụng ứng dụng.</i>`;
    }
  }
});
// Tính năng chat cơ bản
const formChat = document.querySelector("[chat] .inner-form");
if (formChat) {
  formChat.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = formChat.content.value;
    const userId = auth.currentUser.uid;
    if (content && userId) {
      set(push(chatsRef), {
        content: content,
        userId: userId,
      });
      formChat.content.value = "";
    }
  });
}
// Hiển thị tin nhắn
const chatBody = document.querySelector("[chat] .inner-body");
if (chatBody) {
  onChildAdded(chatsRef, (data) => {
    const key = data.key;
    const content = data.val().content;
    const userId = data.val().userId;
    const newChat = document.createElement("div");
    get(child(dbRef, `users/${userId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const fullName = snapshot.val().fullName;
          let htmlFullname = "";
          let htmlButtonDelete = "";
          if (userId == userCurrent.uid) {
            newChat.classList.add("inner-outgoing");
            htmlButtonDelete = `
              <button class="button-delete" button-delete="${key}">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            `;
          } else {
            newChat.classList.add("inner-incoming");
            htmlFullname = `
              <div class="inner-name">
                ${fullName}
              </div>
            `;
          }
          newChat.innerHTML = `
            <div class="inner-name">
              ${htmlFullname}
            </div>
            <div class="inner-content">
              ${content}
            </div>
            ${htmlButtonDelete}
          `;
          chatBody.appendChild(newChat);
          chatBody.scrollTop = chatBody.scrollHeight;
          // Nút xóa tin nhắn
          const buttonDelete = newChat.querySelector(".button-delete");
          if (buttonDelete) {
            buttonDelete.addEventListener("click", () => {
              remove(ref(db, "/chats/" + key)).then(() => {
                chatBody.removeChild(newChat);
              });
            });
          }
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
}
// Lắng nghe xem có tin nhắn nào bị xóa không
onChildRemoved(chatsRef, (data) => {
  const key = data.key;
  const chatItem = chatBody.querySelector(`[chat-key=${key}]`);
  if (chatItem) {
    chatItem.remove();
  }
});
// Tính năng chèn icon
const emojiPicker = document.querySelector("emoji-picker");
if (emojiPicker) {
  const button = document.querySelector(".button-icon");
  const buttonIcon = document.querySelector(".button-icon i");
  const tooltip = document.querySelector(".tooltip");
  Popper.createPopper(button, tooltip);
  button.addEventListener("click", () => {
    tooltip.classList.toggle("shown");
  });
  const inputChat = document.querySelector(".chat .inner-form input[name='content']");
  emojiPicker.addEventListener("emoji-click", (event) => {
    const icon = event.detail.unicode;
    inputChat.value += icon;
  });
  document.addEventListener("click", (event) => {
    if (!emojiPicker.contains(event.target) && event.target != button && event.target != buttonIcon) {
      tooltip.classList.remove("shown");
    }
  });
}
