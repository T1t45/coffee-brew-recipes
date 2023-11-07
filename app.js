// DOM elements
const recipeForm = document.querySelector("#recipe-form");
const recipeContainer = document.querySelector("#recipe-container");
const rootRecipeContainer = document.querySelector("#root-recipe-container");
const editModal = document.querySelector("#editModal");
const feedbackModal = document.querySelector("#feedbackModal");

// Data structure
let listItems = [];

// Constructors and utility functions
function Recipe(name, method, roast, grind, ratio, note, id) {
  (this.name = name),
    (this.method = method),
    (this.roast = roast),
    (this.grind = grind),
    (this.ratio = ratio),
    (this.note = note),
    (this.id = id);
}

function isValidRatio(ratio) {
  const ratioPattern = /^\d+:\d+$/;
  return ratioPattern.test(ratio);
}

// Event handler functions
function handleFormSubmit(e) {
  e.preventDefault();
  const name = DOMPurify.sanitize(recipeForm.querySelector("#name").value);
  const method = DOMPurify.sanitize(recipeForm.querySelector("#method").value);
  const roast = DOMPurify.sanitize(recipeForm.querySelector("#roast").value);
  const grind = DOMPurify.sanitize(recipeForm.querySelector("#grind").value);
  const ratio = DOMPurify.sanitize(recipeForm.querySelector("#ratio").value);
  const note = DOMPurify.sanitize(recipeForm.querySelector("#note").value);
  const newRecipe = new Recipe(
    name,
    method,
    roast,
    grind,
    ratio,
    note,
    Date.now()
  );
  listItems.push(newRecipe);
  e.target.reset();
  recipeContainer.dispatchEvent(new CustomEvent("refreshRecipes"));
  displayFeedbackModal("add");
}

function displayFeedbackModal(action) {
  let feedbackMessage;
  if (action === "add") {
    feedbackMessage = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="alert alert-success" id="successAlert" role="alert">
        <strong>Success!</strong> Recipe added successfully!
      </div>
    </div>
   `;
  } else if (action === "edit") {
    feedbackMessage = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="alert alert-info" id="updateAlert" role="alert">
        <strong>Heads up!</strong> Recipe updated successfully.
      </div>
    </div>
   `;
  }
  feedbackModal.innerHTML = feedbackMessage;
  let feedbackModalBootstrap = new bootstrap.Modal(feedbackModal);
  feedbackModalBootstrap.show();
  setTimeout(function () {
    feedbackModalBootstrap.hide();
  }, 1500);
}

function displayRecipes() {
  if (listItems.length === 0) {
    rootRecipeContainer.style.display = "none";
    rootRecipeContainer.style.visibility = "hidden";
  } else {
    rootRecipeContainer.style.display = "";
    rootRecipeContainer.style.visibility = "visible";
    const tempString = listItems
      .map(
        (item) => `
    <div class="col">
      <div class="card mb-4 rounded-3 shadow-sm border-primary">
        <div class="card-header py-3 text-white bg-primary border-primary">
          <h4 class="my-0">${item.name}</h4>
        </div>
        <div class="card-body">
          <ul class="text-start">
            <li><strong>Method: </strong>${item.method}</li>
            <li><strong>Roast: </strong>${item.roast}</li>
            <li><strong>Grind Size: </strong>${item.grind}</li>
            <li><strong>Ratio: </strong>${item.ratio}</li>
            ${
              !item.note.length
                ? ""
                : `<li>
                  <strong>Note: </strong>${item.note}
                </li>`
            }
          </ul>
          <div class="btn-group" role="group" aria-label="Delete and edit buttons">
            <button class="btn btn-outline-danger me-3" aria-label="Delete ${
              item.name
            }" value="${item.id}"
            >Delete Recipe</button>
           <button 
              class="btn btn-outline-success" 
              aria-label="Edit ${item.name}" 
              value="${item.id}" 
              data-bs-toggle="modal"
              data-bs-target="#editModal"
            >
              Edit Recipe
            </button>
          </div>
        </div>
      </div>
    </div>
  `
      )
      .join("");
    recipeContainer.innerHTML = tempString;
  }
}

function mirrorStateToLocalStorage() {
  localStorage.setItem("recipeContainer.list", JSON.stringify(listItems));
}

function loadinitialUI() {
  const tempLocalStorage = localStorage.getItem("recipeContainer.list");
  if (tempLocalStorage === null || tempLocalStorage.length === 0) return;
  const tempRecipes = JSON.parse(tempLocalStorage);
  listItems.push(...tempRecipes);
  recipeContainer.dispatchEvent(new CustomEvent("refreshRecipes"));
}

function deleteRecipeFromList(id) {
  listItems = listItems.filter((item) => item.id !== id);
  recipeContainer.dispatchEvent(new CustomEvent("refreshRecipes"));
}

function editRecipe(id) {
  const recipeToEdit = listItems.find((item) => item.id === id);
  const labelHeader = document.querySelector("#editModalLabel");
  labelHeader.innerText = "Edit " + recipeToEdit.name;
  document.querySelector("#editModal #edit-name").value = recipeToEdit.name;
  document.querySelector("#editModal #edit-method").value = recipeToEdit.method;
  document.querySelector("#editModal #edit-roast").value = recipeToEdit.roast;
  document.querySelector("#editModal #edit-grind").value = recipeToEdit.grind;
  document.querySelector("#editModal #edit-ratio").value = recipeToEdit.ratio;
  document.querySelector("#editModal #edit-note").value = recipeToEdit.note;
  document.querySelector("#editModal #edit").dataset.id = id;
}

// Event listeners for the form and the recipe container
recipeForm.addEventListener("submit", handleFormSubmit);
recipeContainer.addEventListener("refreshRecipes", displayRecipes);
recipeContainer.addEventListener("refreshRecipes", mirrorStateToLocalStorage);
window.addEventListener("DOMContentLoaded", loadinitialUI);

// Click event delegation for the recipe container
recipeContainer.addEventListener("click", (e) => {
  if (e.target.matches(".btn-outline-danger")) {
    const idToDelete = Number(e.target.value);
    const deleteModal = new bootstrap.Modal(
      document.getElementById("deleteModal")
    );
    const confirmDeleteBtn = document.querySelector("#confirm-delete");
    confirmDeleteBtn.onclick = function () {
      deleteRecipeFromList(idToDelete);
      deleteModal.hide();
    };
    deleteModal.show();
  } else if (e.target.matches(".btn-outline-success")) {
    editRecipe(Number(e.target.value));
  }
});

// Edit button event listener
const editButton = editModal.querySelector("#edit");
editButton.addEventListener("click", function (e) {
  e.preventDefault();
  const id = Number(this.dataset.id);
  const updatedRecipe = listItems.find((item) => item.id === id);
  const ratio = DOMPurify.sanitize(
    editModal.querySelector("#edit-ratio").value
  );
  const alertPlaceholder = document.getElementById("editAlertPlaceholder");
  if (!isValidRatio(ratio)) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error!</strong> Invalid ratio format. Please enter in the form 'X:Y'.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    alertPlaceholder.innerHTML = alertHtml;
    setTimeout(function () {
      alertPlaceholder.innerHTML = "";
    }, 5000);
  } else {
    updatedRecipe.name = DOMPurify.sanitize(
      editModal.querySelector("#edit-name").value
    );
    updatedRecipe.method = DOMPurify.sanitize(
      editModal.querySelector("#edit-method").value
    );
    updatedRecipe.roast = DOMPurify.sanitize(
      editModal.querySelector("#edit-roast").value
    );
    updatedRecipe.grind = DOMPurify.sanitize(
      editModal.querySelector("#edit-grind").value
    );
    updatedRecipe.ratio = ratio;
    updatedRecipe.note = DOMPurify.sanitize(
      editModal.querySelector("#edit-note").value
    );
    recipeContainer.dispatchEvent(new CustomEvent("refreshRecipes"));
    const modalInstance = bootstrap.Modal.getInstance(editModal);
    modalInstance.hide();
    displayFeedbackModal("edit");
  }
});

// Edit modal show event listener
editModal.addEventListener("show.bs.modal", function (e) {
  const button = e.relatedTarget;
  const id = Number(button.getAttribute("value"));
  editButton.dataset.id = id;

  const recipeToEdit = listItems.find((item) => item.id === id);
  const labelHeader = document.querySelector("#editModalLabel");
  labelHeader.innerText = "Edit " + recipeToEdit.name;
  document.querySelector("#editModal #edit-name").value = recipeToEdit.name;
  document.querySelector("#editModal #edit-method").value = recipeToEdit.method;
  document.querySelector("#editModal #edit-roast").value = recipeToEdit.roast;
  document.querySelector("#editModal #edit-grind").value = recipeToEdit.grind;
  document.querySelector("#editModal #edit-ratio").value = recipeToEdit.ratio;
  document.querySelector("#editModal #edit-note").value = recipeToEdit.note;
});
