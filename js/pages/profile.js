// =========================
// ELEMENTS
// =========================

const tabs = document.querySelectorAll(".tab");

const productsSection =
  document.querySelector(".products");

const guestButtons =
  document.querySelector(".guest-buttons");
  console.log(guestButtons);

const editBtn =
  document.querySelector(".edit-btn");

// =========================
// USER CHECK
// =========================

const userData =
JSON.parse(
  localStorage.getItem("userData")
);

const userId =
  userData?._id;

// =========================
// GUEST MODE
// =========================

if(!userData){




  console.log("Guest User");

  // HIDE EDIT BUTTON
  if(editBtn){
  editBtn.style.display = "none";
}

  // SHOW EMPTY PRODUCTS
  productsSection.innerHTML = `

    <div class="empty-products">

      <i class="fa-solid fa-user-lock"></i>

      <h3>Login Required</h3>

      <p>
        Login to view your products,
        saved items and activity.
      </p>

    </div>

  `;

}

// =========================
// LOGGED USER MODE
// =========================

else{

  console.log("Logged User");

  // HIDE LOGIN BUTTONS
  if(guestButtons){
  guestButtons.style.display = "none";
}

  // SHOW EDIT BUTTON
    if(editBtn){
  editBtn.style.display = "inline-block";
}

  // LOAD REAL PROFILE
  loadProfile();
  
  // REAL USER INFO

document.querySelector(".profile-name")
  .innerText = userData.name;

document.querySelector(".bio")
  .innerText =
  userData.bio || "Bazaria User";

// PROFILE IMAGE

if(userData.avatar){

  document.querySelector(".profile-pic")
    .src = userData.avatar;

}

}

// =========================
// LOAD PROFILE
// =========================

async function loadProfile(){

  try{

    const res = await fetch(
      `http://localhost:5000/api/user/profile/${userId}`
    );

    const data = await res.json();

    console.log(data);

    // =========================
    // PROFILE INFO
    // =========================

    document.querySelector(".profile-name")
      .innerText = data.user.name;

    document.querySelector(".bio")
      .innerText =
      data.user.bio || "Bazaria User";

    // PROFILE IMAGE

    if(data.user.avatar){

      document.querySelector(".profile-pic")
        .src = data.user.avatar;

    }

    // =========================
    // STATS
    // =========================

    const stats =
      document.querySelectorAll(".stat h3");

const stats =
  document.querySelectorAll(".stat h3");

if(stats[0]){
  stats[0].innerText =
    data.products.length;
}

if(stats[1]){
  stats[1].innerText = "4.5K";
}

if(stats[2]){
  stats[2].innerText = "12K";
}

if(stats[3]){
  stats[3].innerText = "320";
}

if(stats[4]){
  stats[4].innerText = "80";
}

    // =========================
    // PRODUCTS
    // =========================

    renderProducts(data.products);

  }

  catch(error){

    console.log(
      "Profile Load Error:",
      error
    );

  }

}

// =========================
// RENDER PRODUCTS
// =========================

function renderProducts(products){

  // EMPTY

  if(!products || products.length === 0){

    productsSection.innerHTML = `

      <div class="empty-products">

        <i class="fa-solid fa-box-open"></i>

        <h3>No Products Yet</h3>

        <p>
          Start selling on Bazaria
        </p>

      </div>

    `;

    return;

  }

  // REAL PRODUCTS

  productsSection.innerHTML =

    products.map(product => `

      <div class="product-card">

        <img src="${
          product.images?.[0] ||
          'https://picsum.photos/300'
        }">

        <div class="info">

          <h3>
            ${product.title}
          </h3>

          <p class="price">
            $${product.resellerPrice}
          </p>

          <div class="meta">

            <span>
              ❤️ ${product.likes || 0}
            </span>

            <span>
              👁 ${product.views || 0}
            </span>

            <span>
              🛒 ${product.stock || 0}
            </span>

          </div>

          <button class="buy-btn">
            Buy Now
          </button>

        </div>

      </div>

    `).join("");

}

// =========================
// TABS
// =========================

tabs.forEach(tab => {

  tab.addEventListener("click", () => {

    tabs.forEach(t =>
      t.classList.remove("active")
    );

    tab.classList.add("active");

    const selected =
      tab.innerText.trim();

    switchContent(selected);

  });

});

// =========================
// SWITCH CONTENT
// =========================

function switchContent(type){

  // GUEST MODE

  if(!userId){

    productsSection.innerHTML = `

      <div class="empty-products">

        <i class="fa-solid fa-lock"></i>

        <h3>Login Required</h3>

        <p>
          Please login to access
          ${type}
        </p>

      </div>

    `;

    return;

  }

  // PRODUCTS

  if(type === "Products"){

    loadProfile();

  }

  // OTHER TABS

  else{

    productsSection.innerHTML = `

      <div class="empty-products">

        <i class="fa-solid fa-clock"></i>

        <h3>${type}</h3>

        <p>
          Coming Soon...
        </p>

      </div>

    `;

  }

}