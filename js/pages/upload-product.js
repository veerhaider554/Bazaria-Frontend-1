/* ==========================================
   BAZARIA

   Module  : Sell System
   Page    : Upload Product

   Version : 2.0 (Pro Production Ready)
   Author  : Haider Abbas

========================================== */



/* ==========================================
   DOM ELEMENTS
========================================== */

const productImages = document.getElementById("productImages");
const uploadBtn = document.querySelector(".upload-btn");
const addMoreBtn = document.getElementById("addMoreBtn");
const previewGrid = document.querySelector(".preview-strip");
const uploadBox = document.querySelector(".upload-box");
const heroPreview = document.getElementById("heroPreview");
const uploadContent = document.querySelector(".upload-content");
const heroContainer = document.querySelector(".hero-image-container");
const photoCounter = document.getElementById("photoCounter");
const brandSelect = document.getElementById("brand");
const customBrandGroup = document.getElementById("customBrandGroup");
const conditionDetailsGroup = document.getElementById("conditionDetailsGroup");
const productName = document.getElementById("product-name");
const productNameCounter = document.getElementById("productNameCounter");
const productNameError = document.getElementById("productNameError");
const category = document.getElementById("category");
const subCategory = document.getElementById("subCategory");
const dynamicSpecifications = document.getElementById("dynamicSpecifications");
const conditionSelect = document.getElementById("condition");





/* ==========================================
   GLOBAL VARIABLES
========================================== */

let selectedImages = [];
let heroImageIndex = 0;


/* ==========================================
   EVENT LISTENERS
========================================== */
productImages.addEventListener("change", handleImageSelection);


brandSelect.addEventListener("change", function(){
    if(brandSelect.value === "other"){
        customBrandGroup.classList.add("show");
    } else {
        customBrandGroup.classList.remove("show");
    }
});


/* ==========================================
   SMART UI: CONDITION EVENT LISTENER
   (یہ تمام ریڈیو بٹنز کو سنے گا اور ڈیٹیلز باکس دکھائے گا)
========================================== */
conditionSelect.addEventListener("change", function(){
    const value = conditionSelect.value;
    // اگر نیو کے علاوہ کوئی بھی حالت ہو تو ڈیٹیلز باکس کھل جائے گا
    if(value && value !== "new"){
        conditionDetailsGroup.classList.add("show");
    } else {
        conditionDetailsGroup.classList.remove("show");
    }
});




productName.addEventListener("input", updateProductNameCounter);
productName.addEventListener("blur", cleanProductName);
productName.addEventListener("blur", validateProductName);


category.addEventListener("change", function(){
    loadSubCategories();
    brandSelect.innerHTML = `<option value="">Select Brand</option>`;
});


subCategory.addEventListener("change", function(){
    loadBrands();
    loadSpecifications();
});



/* ==========================================
   IMAGE PICKER & PREVIEW (PRO FILE READER FIX)
========================================== */

function handleImageSelection(event){
    const newImages = Array.from(event.target.files);
    selectedImages = [...selectedImages, ...newImages];

    if(selectedImages.length > 10){
        alert("Maximum 10 photos allowed.");
        selectedImages = selectedImages.slice(0, 10);
    }

    uploadContent.classList.add("hidden");
    renderImagePreview();
    renderHeroImage();
    updatePhotoCounter();
    productImages.value = "";
}

function removeImage(index){
    selectedImages.splice(index, 1);

    if(selectedImages.length === 0){
        resetUploadState();
        renderImagePreview();
        updatePhotoCounter();
        return;
    }

    if(heroImageIndex >= selectedImages.length){
        heroImageIndex = selectedImages.length - 1;
    }

    renderHeroImage();
    renderImagePreview();
    updatePhotoCounter();
}


uploadBtn.addEventListener("click", openFilePicker);
addMoreBtn.addEventListener("click", openFilePicker);


function openFilePicker(){
    productImages.click();
}


function renderImagePreview(){
    previewGrid.innerHTML = "";
    selectedImages.forEach((image, index) => {
        const previewCard = createPreviewCard(image, index);
        previewGrid.appendChild(previewCard);
    });
}

// 🌟 پروفیشنل FileReader حل جو ہر قسم کی ڈاؤن لوڈ کردہ/ٹک ٹاک تصاویر کو 100% دکھائے گا
function createPreviewCard(image, index){
    const previewCard = document.createElement("div");
    previewCard.classList.add("preview-slot");
    
    if(index === heroImageIndex){
        previewCard.classList.add("active");
    }

    const imageElement = document.createElement("img");
    imageElement.classList.add("preview-image");

    const reader = new FileReader();
    reader.onload = function(e) {
        imageElement.src = e.target.result;
    };
    reader.readAsDataURL(image);

    const removeButton = document.createElement("button");
    removeButton.addEventListener("click", function(event){
        event.stopPropagation();
        removeImage(index);
    });

    removeButton.classList.add("remove-image-btn");
    removeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    previewCard.appendChild(imageElement);
    previewCard.appendChild(removeButton);

    previewCard.addEventListener("click", function(){
        heroImageIndex = index;
        renderHeroImage();
        renderImagePreview();
    });

    return previewCard;
}


function renderHeroImage(){
    if(selectedImages.length === 0){
        heroContainer.innerHTML = "";
        heroContainer.style.display = "none";
        return;
    }

    heroContainer.innerHTML = "";
    const heroImage = document.createElement("img");
    heroImage.classList.add("hero-image");

    const reader = new FileReader();
    reader.onload = function(e) {
        heroImage.src = e.target.result;
    };
    reader.readAsDataURL(selectedImages[heroImageIndex]);

    heroContainer.appendChild(heroImage);
    heroContainer.style.display = "block";
}


function updatePhotoCounter(){
    photoCounter.textContent = `(${selectedImages.length}/10)`;
}


function resetUploadState(){
    heroContainer.innerHTML = "";
    heroContainer.style.display = "none";
    uploadContent.classList.remove("hidden");
    heroImageIndex = 0;
}


/* ==========================================
   PRODUCT NAME VALIDATION & COUNTER
========================================== */

function updateProductNameCounter(){
    const currentLength = productName.value.length;
    productNameCounter.textContent = `${currentLength} / 100`;
    
    if(productNameError.textContent !== ""){
        validateProductName();
    }
}


function cleanProductName(){
    productName.value = productName.value.trim().replace(/\s+/g, " ");
}


function validateProductName(){
    const value = productName.value.trim();

    if(value === ""){
        productNameError.textContent = "Product name is required.";
        productName.classList.add("input-error");
        productName.classList.remove("input-success");
        return false;
    }

    if(value.length < 2){
        productNameError.textContent = "Product name must be at least 2 characters.";
        productName.classList.add("input-error");
        productName.classList.remove("input-success");
        return false;
    }

    productNameError.textContent = "";
    productName.classList.remove("input-error");
    productName.classList.add("input-success");
    return true;
}



/* ==========================================
   CATEGORY DATA & DROPDOWNS
========================================== */
const categoryData = {
    Electronics: {
        subCategories: {
            Mobiles: {
                brands: ["Apple", "Samsung", "Xiaomi", "Realme"],
                specifications: [
                    { label: "RAM", type: "select", options: ["2 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"] },
                    { label: "Storage", type: "select", options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"] },
                    { label: "Processor", type: "text" },
                    { label: "Screen Size", type: "text" },
                    { label: "Battery", type: "text" },
                    { label: "Color", type: "text" }
                ]
            },
            Laptops: {
                brands: ["Dell", "HP", "Lenovo", "Apple"],
                specifications: [
                    { label: "RAM", type: "select", options: ["2 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "32 GB", "64 GB"] },
                    { label: "Storage", type: "select", options: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"] },
                    { label: "Processor", type: "text" },
                    { label: "Battery", type: "text" }
                ]
            }
        }
    },
    Fashion: {
        subCategories: {
            Shoes: {
                brands: ["Nike", "Adidas", "Puma"],
                specifications: [
                    { label: "Size", type: "text" },
                    { label: "Color", type: "text" },
                    { label: "Material", type: "text" }
                ]
            },
            Clothing: {
                brands: ["Levis", "Outfitters", "Breakout"],
                specifications: [
                    { label: "Size", type: "text" },
                    { label: "Color", type: "text" },
                    { label: "Fabric", type: "text" }
                ]
            }
        }
    }
};


function loadCategories(){
    category.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Category";
    category.appendChild(defaultOption);

    for(const categoryName in categoryData){
        const option = document.createElement("option");
        option.value = categoryName;
        option.textContent = categoryName;
        category.appendChild(option);
    }
}

loadCategories();


function loadSubCategories(){
    subCategory.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Sub Category";
    subCategory.appendChild(defaultOption);

    if(category.value === "") return;

    const subCategories = categoryData[category.value].subCategories;
    for(const subCategoryName in subCategories){
        const option = document.createElement("option");
        option.value = subCategoryName;
        option.textContent = subCategoryName;
        subCategory.appendChild(option);
    }
}


function loadBrands(){
    brandSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Brand";
    brandSelect.appendChild(defaultOption);

    if(category.value === "" || subCategory.value === "") return;

    const brands = categoryData[category.value].subCategories[subCategory.value].brands;
    brands.forEach(function(brand){
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });

    const otherOption = document.createElement("option");
    otherOption.value = "other";
    otherOption.textContent = "Other...";
    brandSelect.appendChild(otherOption);
}





/* ==========================================
   DESCRIPTION COUNTER & DELIVERY LOGIC
========================================== */
const descriptionInput = document.getElementById("description");
const descriptionCounter = document.querySelector(".description-section .character-counter");

if (descriptionInput && descriptionCounter) {
    descriptionInput.addEventListener("input", function() {
        const currentLength = descriptionInput.value.length;
        descriptionCounter.textContent = `${currentLength} / 1000 Characters`;
    });
}

const deliverySelect = document.getElementById("delivery");
const deliveryChargeInput = document.getElementById("delivery-charge");

if (deliverySelect && deliveryChargeInput) {
    const deliveryChargeGroup = deliveryChargeInput.closest(".input-group");
    deliveryChargeGroup.style.display = "none";

    deliverySelect.addEventListener("change", function() {
        if (deliverySelect.value === "Yes") {
            deliveryChargeGroup.style.display = "flex";
        } else {
            deliveryChargeGroup.style.display = "none";
            deliveryChargeInput.value = ""; 
        }
    });
}

// ==========================================
// SMART SPECIFICATIONS & COLOR SWATCHES ENGINE
// (یہ فنکشن سپیسیفیکیشنز کے ساتھ ساتھ کلرز کے لیے سمارٹ کلک ایبل سورچز بنائے گا)
// ==========================================
function loadSpecifications(){
    dynamicSpecifications.innerHTML = "";

    if(category.value === "" || subCategory.value === "") return;

    const specifications = categoryData[category.value].subCategories[subCategory.value].specifications;

    specifications.forEach(function(specification){
        const inputGroup = document.createElement("div");
        inputGroup.classList.add("input-group");

        const label = document.createElement("label");
        label.textContent = specification.label;
        inputGroup.appendChild(label);

        let field;

        // اگر سپیسیفیکیشن کا لیبل "Color" ہے، تو ہم اسے سمارٹ کلر سورچز میں بدل دیں گے!
        if(specification.label.toLowerCase() === "color") {
            const colorContainer = document.createElement("div");
            colorContainer.classList.add("smart-color-container");
            colorContainer.style.cssText = "display: flex; gap: 10px; flex-wrap: wrap; margin-top: 5px;";

            //پری ڈیفाइंड پریمیم کلرز کی لسٹ
            const colorList = [
                { name: "Black", code: "#111111", border: "#444" },
                { name: "White", code: "#ffffff", border: "#ccc" },
                { name: "Red", code: "#ff4d4f", border: "#ff4d4f" },
                { name: "Blue", code: "#3b82f6", border: "#3b82f6" },
                { name: "Green", code: "#22c55e", border: "#22c55e" },
                { name: "Purple", code: "#8b5cf6", border: "#8b5cf6" },
                { name: "Gold", code: "#fbbf24", border: "#fbbf24" }
            ];

            // ایک چھپا ہوا ان پٹ جو سلیکٹڈ کلر کی ویلیو بیک اینڈ پر بھیجے گا
            const hiddenColorInput = document.createElement("input");
            hiddenColorInput.type = "hidden";
            hiddenColorInput.name = specification.label;
            hiddenColorInput.value = "";
            inputGroup.appendChild(hiddenColorInput);

            colorList.forEach(c => {
                const swatch = document.createElement("div");
                swatch.classList.add("color-swatch");
                swatch.title = c.name;
                swatch.style.cssText = `width: 32px; height: 32px; border-radius: 50%; background-color: ${c.code}; border: 2px solid ${c.border}; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;`;

                swatch.addEventListener("click", function() {
                    // باقی سب سورچز سے ایکٹیو بارڈر ہٹادیں
                    colorContainer.querySelectorAll(".color-swatch").forEach(s => s.style.transform = "scale(1)");
                    // کلک کیے گئے سورچ کو زوم اور ہائی لائٹ کریں
                    swatch.style.transform = "scale(1.15)";
                    swatch.style.boxShadow = "0 0 10px var(--primary-color)";
                    
                    // ویلیو چھپے ہوئے ان پٹ میں سیو کردیں
                    hiddenColorInput.value = c.name;
                });

                colorContainer.appendChild(swatch);
            });

            field = colorContainer;
        } 
        else if(specification.type === "select"){
            field = document.createElement("select");
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = `Select ${specification.label}`;
            field.appendChild(defaultOption);

            specification.options.forEach(function(option){
                const optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.textContent = option;
                field.appendChild(optionElement);
            });
        } else {
            field = document.createElement("input");
            field.type = specification.type;
            field.placeholder = `Enter ${specification.label}`;
        }

        inputGroup.appendChild(field);
        dynamicSpecifications.appendChild(inputGroup);
    });
}


/* ==========================================
   PUBLISH TO BACKEND (LIVE INTEGRATION)
========================================== */
const publishBtn = document.querySelector(".publish-section .btn-primary");

if (publishBtn) {
    publishBtn.addEventListener("click", async function(event) {
        event.preventDefault(); 
        
        if(selectedImages.length === 0 || productName.value.trim() === "") {
            alert("Please add at least one image and a product name before publishing.");
            return;
        }

        const originalText = publishBtn.textContent;
        publishBtn.textContent = "Uploading to Bazaria... 🚀";
        publishBtn.disabled = true;

        try {
            const formData = new FormData();

            formData.append("name", productName.value);
            formData.append("category", category.value);
            formData.append("subCategory", subCategory.value);
            formData.append("brand", brandSelect.value === "other" ? document.getElementById("custom-brand").value : brandSelect.value);
formData.append("condition", conditionSelect.value);



            
            if (conditionDetailsGroup.classList.contains("show")) {
                const conditionDetailsInput = document.getElementById("condition-details");
                if(conditionDetailsInput) formData.append("conditionDetails", conditionDetailsInput.value);
            }

            formData.append("price", document.getElementById("price") ? document.getElementById("price").value : 0);
            const originalPriceInput = document.getElementById("original-price");
            if(originalPriceInput) formData.append("originalPrice", originalPriceInput.value);
            
            const stockInput = document.getElementById("stock");
            if(stockInput) formData.append("stock", stockInput.value);

            const descInput = document.getElementById("description");
            if(descInput) formData.append("description", descInput.value);
            
            const citySelect = document.getElementById("city");
            if(citySelect) formData.append("city", citySelect.value);
            
            const areaInput = document.getElementById("area");
            if(areaInput) formData.append("area", areaInput.value);

            const deliveryDropdown = document.getElementById("delivery");
            if(deliveryDropdown) {
                formData.append("deliveryAvailable", deliveryDropdown.value);
                if (deliveryDropdown.value === "Yes") {
                    const delCharge = document.getElementById("delivery-charge");
                    if(delCharge) formData.append("deliveryCharges", delCharge.value);
                }
            }

            const pickupDropdown = document.getElementById("pickup");
            if(pickupDropdown) {
                formData.append("pickupAvailable", pickupDropdown.value);
            }

            // ڈائنامک Specifications کو صحیح طریقے سے کیپچر کرنا
            const specs = {};
            const specGroups = dynamicSpecifications.querySelectorAll(".input-group");
            specGroups.forEach(group => {
                const labelEl = group.querySelector("label");
                const inputEl = group.querySelector("input, select");
                if (labelEl && inputEl) {
                    specs[labelEl.textContent] = inputEl.value;
                }
            });
            formData.append("specifications", JSON.stringify(specs));

            // تصاویر اپینڈ کرنا
            selectedImages.forEach((image) => {
                formData.append("images", image);
            });

            // بیک اینڈ پر ریکویسٹ بھیجنا
const API_BASE_URL = "http://localhost:5000/api";

const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    body: formData,
});

const result = await response.json();

if (!response.ok) {
    const message =
        result?.message ||
        "Product upload failed";

    throw new Error(message);
}

if (result.success) {
    alert("🎉 Success: " + result.message);
    window.location.href = "home.html";
} else {
    throw new Error(
        result?.message ||
        "Product upload failed"
    );
}

        } catch (error) {
            console.error("Upload Error:", error);
            alert("⚠️ Failed to connect to the server. Make sure the backend is running on Termux.");
        } finally {
            publishBtn.textContent = originalText;
            publishBtn.disabled = false;
        }
    });
}


/* ==========================================
   DRAFT BUTTON 
========================================== */
const saveDraftBtn = document.querySelector(".publish-section .btn-secondary");

if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", function(event) {
        event.preventDefault();
        alert("Draft functionality will be implemented soon!");
    });
}
