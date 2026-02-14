//elements
const slider = document.getElementById("slider")
const value = document.getElementById("slider-value")
const password = document.getElementById("password")
const passwordCopy = document.getElementById("passwordCopy")
//changng slider value
//saving the vale to cookies
slider.value = localStorage.getItem("DefaultLength")
value.innerText = slider.value
slider.addEventListener("input",(el)=>{
    value.innerText = slider.value
    localStorage.setItem("DefaultLength",slider.value)
})
//copying
passwordCopy.addEventListener("click",(el)=>{
    const onlyPassword = password.innerText.split(":")[1]
    navigator.clipboard.writeText(onlyPassword);
})
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



