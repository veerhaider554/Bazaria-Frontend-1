
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const response = await fetch("http://localhost:5000/api/auth/login", {

      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      credentials:"include",

      body:JSON.stringify({
        email,
        password
      })

    });

    const data = await response.json();
console.log(data.user);

if(response.ok){

  message.style.color = "#00ff99";
  message.innerText = "Login successful";

  // =========================
  // SAVE USER DATA
  // =========================

  // CHECK USER OBJECT

if(data.user){

  localStorage.setItem(
    "userId",
    data.user._id
  );

  localStorage.setItem(
    "userData",
    JSON.stringify(data.user)
  );

}

  // =========================
  // REDIRECT TO PROFILE
  // =========================

  setTimeout(() => {

    window.location.href =
      "../profile.html";

  },1200);

}

    else {

      message.style.color = "red";
      message.innerText = data.message;

    }

  } catch(error){

    message.style.color = "red";
    message.innerText = "Server error";

  }

});