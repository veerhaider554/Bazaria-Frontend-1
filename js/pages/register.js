

  let selectedRole = "customer";

  const roleButtons = document.querySelectorAll(".role-btn");

  roleButtons.forEach(button => {

    button.addEventListener("click", () => {

      roleButtons.forEach(btn => btn.classList.remove("active"));

      button.classList.add("active");

      selectedRole = button.dataset.role;

    });

  });

  const registerForm = document.getElementById("registerForm");
  const message = document.getElementById("message");

  registerForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // basic strong password check

    if(password.length < 8){
      message.style.color = "red";
      message.innerText = "Password must be at least 8 characters";
      return;
    }

    try {

      const response = await fetch("http://localhost:5000/api/auth/register", {

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          name,
          email,
          password,
          role:selectedRole
        })

      });

      const data = await response.json();
if(response.ok){

  message.style.color = "#00ff99";

  message.innerText =
    "Account created successfully";

  // SAVE USER

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

  registerForm.reset();

  setTimeout(() => {

    window.location.href =
      "../login.html";

  },1500);

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