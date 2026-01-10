

const error = document.getElementById("error");
const email = document.getElementById("email");
const form = document.getElementById("form");
const button = document.getElementById("button");
const label = document.getElementById("label");
const text = document.getElementById("text");
const password = document.getElementById("password");
const passwordLabel = document.getElementById("passwordlabel");
const eyeimg = document.getElementById("eyeimg");
const code = document.getElementById("code");
const codeLabel = document.getElementById("codelabel");
const resend = document.getElementById("resend");
password.style.display = "none";
passwordLabel.style.display = "none";
eyeimg.style.display = "none";
code.style.display = "none";
codeLabel.style.display = "none";
resend.style.display = "none";
let iturn = "email"
//sending request to the backend
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if(iturn === "email"){
  const response = await fetch("/verifyemail", {
    method: "POST",
    credentials:"include",
    body: JSON.stringify({ email: email.value.trim() }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data.error) {
    error.textContent = data.error;
  } else {
    //changing turn to code
    iturn = "code";
    //setting the code input
    error.textContent = "";
    code.removeAttribute("style");
    codeLabel.removeAttribute("style");
    resend.removeAttribute("style");
    email.style.display = "none";
    label.style.display = "none";
    button.textContent = "Verify Code";
text.textContent = "Enter the code sent to your email";
  }
}else if(iturn === "code"){
  //verifying the code
  const response = await fetch("/verifycode", {
    method: "POST",
    body: JSON.stringify({ code: code.value.trim() }),
    credentials:"include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  if (data.error) {
    error.textContent = data.error;
  } else {
    iturn = "password"
    resend.style.display = "none";
password.removeAttribute("style");
password.name = "reset";
passwordLabel.style.display = "block";
eyeimg.removeAttribute("style");
code.style.display = "none"; 
codeLabel.style.display = "none";
    passwordLabel.textContent = "new password:";
    text.textContent = "Enter your new password";
    button.textContent = "Reset Password";
    error.textContent=""

  }
}else if(iturn === "password"){
const response = await fetch("/resetpassword", {
    method:"POST",
    body: JSON.stringify({ password:password.value.trim() }),
    credentials:"include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json()
  if (data.error) {
    error.textContent = data.error;
  }
  console.log("reset");
}
});
//resend
resend.addEventListener("click",async(el)=>{
  el.preventDefault()
  resend.style.color = "gray";
  //sending response
   const response = await fetch("/verifyemail", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ email: email.value.trim() }),
    headers: {
      "Content-Type": "application/json",
    },
 })
 const data = await response.json()
  if (data.error) {
    error.textContent = data.error;
    resend.disabled = true;//disabling
  }
  //timeout
 setTimeout(() => {
resend.disabled = false;//enabling
resend.removeAttribute("style")
   }, 60000);
})

