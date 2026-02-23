//elements
const slider = document.getElementById("slider")
const value = document.getElementById("slider-value")
const password = document.getElementById("password")
const passwordCopy = document.getElementById("passwordCopy")
const generator = document.getElementById("generator")
const vault = document.getElementById("vault")
//changng slider value
//saving the vale to cookies
if (window.location.pathname === "/vault") {
  console.log("vault")
  vault.style.borderBottom = "2px solid blue"
  generator.style.borderBottom = "none"

} else if (window.location.pathname === "/") {
  console.log("generator")
  generator.style.borderBottom = "2px solid blue"
  vault.style.borderBottom = "none"
}

slider.value = localStorage.getItem("DefaultLength")
value.innerText = slider.value
slider.addEventListener("input",(el)=>{
    value.innerText = slider.value
    localStorage.setItem("DefaultLength",slider.value)
})
//copying
passwordCopy.addEventListener("click",(el)=>{
  //if no elements 
if(passwordCopy.dataset.elements.length === 0 ){
  console.log(passwordCopy.dataset.elements)
  return ;
}
passwordCopy.style.backgroundColor = "black"
    const onlyPassword = password.innerText.split(":")[1]
    navigator.clipboard.writeText(onlyPassword);
    setTimeout(()=>{
  passwordCopy.removeAttribute("Style")
    },1000)
  
})
//list copy
const list = document.querySelectorAll(".ListpasswordCopy");

list.forEach((item) => {
  item.addEventListener("click", () => {
    console.log("clicked");

    item.style.color = "black";

    const password = item.dataset.elements;
    if (!password) return;

    navigator.clipboard.writeText(password);

    setTimeout(() => {
      item.removeAttribute("style");
    }, 1000);
  });
});


//clear
const clear = document.getElementById("clear")
const recents = document.getElementById("recents")
clear.addEventListener("click", (el) => {
  fetch("/clear", {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to clear");
      }
      return response.json();
    })
    .then((res) => {
      console.log("response ok");
      if (res.url) {
        window.location.href = res.url;
      }
    })
    .catch((err) => {
      clear.innerText ="no data to clear"
      setTimeout(()=>{
clear.innerText = "clear"
      },3000)
      console.log(`error from main js while clearing ${err}`);
    });
})
//delete
const deleteButtons = document.querySelectorAll("#delete");
deleteButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
      console.log("clicked")
    const appName = btn.dataset.appname;
    if (!appName) return;

    fetch(`/delete/${encodeURIComponent(appName)}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete");
        }
        return response.json();
      })
      .then((res) => {
        if (res.url) {
          window.location.href = res.url;
        } else {
          window.location.reload();
        }
      })
      .catch((err) => {
        console.log(`error from main js while deleting ${err}`);
      });
  });
});
//logout
const logout = document.getElementById("logout")
logout.addEventListener("click",()=>{
fetch("/logout",{
  method:"POST"
}
).then((response)=>{
  if(!response.ok){
throw new error ("field to logout")
  }
  return response.json
}).then((response)=>{
  if(response.url){
  window.location.href = res.url
  }else{
    window.location.reload()
  }
  
})  .catch((err) => {
  console.log(`error from main js while loging out ${err}`);
});
})




