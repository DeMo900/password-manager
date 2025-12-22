const passwordInput = document.getElementById("password")
const eyeBtn = document.getElementById("eyeBtn")
let turn = "password"
eyeBtn.addEventListener("click",(el)=>{
  if(turn === "password"){
    eyeBtn.src = "./show.svg"
    passwordInput.type = "text"
    turn = "text"
  }else{
    eyeBtn.src = "./hide.svg"
    passwordInput.type = "password"
    turn = "password"
  }
})