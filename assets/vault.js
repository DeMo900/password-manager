
const generator = document.getElementById("generator")
const vault = document.getElementById("vault")

  vault.style.borderBottom = "2px solid blue"
  generator.style.borderBottom = "none"

// Elements by ID
const tbody = document.getElementById("tbody");
const username = document.getElementById("username");
const searchInput = document.getElementById("search-input");
const passwordHidden = document.getElementById("password");
const deleteImg = document.querySelectorAll(".delete-img");
const arrowLeftBtn = document.getElementById("arrow-left-btn");
const arrowLeftImg = document.getElementById("arrow-left");
const arrowRightBtn = document.getElementById("arrow-right-btn");
const buttons = document.getElementById("buttons");
const arrowRightImg = document.getElementById("arrow-right");
const logout = document.getElementById("logout");
const pageValue = document.getElementById("value");
const totalResults = document.getElementById("total-results");
//arrows
buttons.addEventListener("click", (e) => {
  if (e.target === arrowLeftBtn || e.target === arrowLeftImg) {
    if (pageValue.textContent > 1) {
      pageValue.textContent = parseInt(pageValue.textContent) - 1;
    }
  }else if (e.target === arrowRightBtn || e.target === arrowRightImg) {
    const pages = Math.ceil(parseInt(totalResults.textContent) / 10);
    if (pageValue.textContent < pages) {
    pageValue.textContent = parseInt(pageValue.textContent) + 1;
    }
  }
  fetch(`/vault/data?page=${pageValue.textContent}`).then((response)=>{
    if(!response.ok){
      throw new Error("failed to fetch data")
    }
    return response.json()
  }).then((data)=>{
    if (data.data.length === 0) {
      return;
    }
    tbody.innerHTML = ""
    username.textContent = data.username
    //looping through data
    data.data.forEach(el => {
    const tr = document.createElement("tr")
    const date =  new Date(el.createdAt).toISOString().split("T")[0]  
    
  tr.innerHTML =`
          <td class="px-10 py-4 text-white">
            
              <span >${el.appname}</span>
          </td>
          <td id="password" data-id="${el._id}" class="px-24 py-4 text-white cursor-pointer password">••••••••</td>
          <td class="text-white px-24 py-4">${date}</td>
          <td class="px-24 py-4 text-red-500 cursor-pointer hover:text-red-600">
            <div class="flex justify-center gap-4 items-center">
              <img  src="./copy.svg" alt="Copy" class="hover:bg-slate-400/50 transition duration-300 border-left-2 copy-img">
              <img src="./delete.png" alt="Delete" class="w-8 hover:bg-red-600/30 rounded-md transition duration-200 delete-img">
            </div>
          </td>
  `
    tbody.appendChild(tr)   
    });
  totalResults.textContent = data.total
  }).catch((err)=>{
    console.log(`error from main js while fetching data ${err}`);
  })
})
/*
arrowLeftBtn.addEventListener("click", () => {
  if (pageValue.textContent > 1) {
    pageValue.textContent = parseInt(pageValue.textContent) - 1
  }
})
arrowRightBtn.addEventListener("click", () => {
  pageValue.textContent = parseInt(pageValue.textContent) + 1
})
*/
//logout
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
//getting data
fetch(`/vault/data?page=${pageValue.textContent}`).then((response)=>{//temp
  if(!response.ok){
    throw new Error("failed to fetch data")
  }
  return response.json()
}).then((data)=>{
  username.textContent = data.username
  totalResults.textContent = data.total
  //looping through data
  data.data.forEach(el => {
   const date =  new Date(el.createdAt).toISOString().split("T")[0]
   
  const tr = document.createElement("tr")
tr.innerHTML =`
        <td class="px-10 py-4 text-white">
          
            <span >${el.appname}</span>
        </td>
        <td  id="password" data-id="${el._id}" class="px-24 py-4 text-white cursor-pointer password">••••••••</td>
        <td class="text-white px-24 py-4">${date}</td>
        <td class="px-24 py-4 text-red-500 cursor-pointer hover:text-red-600">
          <div class="flex justify-center gap-4 items-center">
            <img  src="./copy.svg" alt="Copy" class="hover:bg-slate-400/50 transition duration-300 border-left-2 copy-img">
            <img src="./delete.png" alt="Delete" class="w-8 hover:bg-red-600/30 rounded-md transition duration-200 delete-img">
          </div>
        </td>
`
  tbody.appendChild(tr)   
  });
 

}).catch((err)=>{
  console.log(`error from main js while fetching data ${err}`);
})
//copying
const copyImg = document.querySelectorAll(".copy-img");

tbody.addEventListener("click", (e) => {
if(e.target.classList.contains("copy-img")){//copying
  const password = e.target.closest("tr").querySelector("td:nth-child(2)").textContent; 
  //sending request to show password
  const passwordID = e.target.closest("tr").querySelector("td:nth-child(2)").dataset.id;//getting the password id
  fetch(`/showpassword/${passwordID}`).then((response)=>{
  if(!response.ok){
    throw new Error("failed to fetch password")
  }
  return response.json()
 }).then((data)=>{
  navigator.clipboard.writeText(data.password)//copying to clipboard
 }).catch((err)=>{
  console.log(`error from main js while showing password ${err}`);
 })
  e.target.src = "./check-mark.svg"
  e.target.style.width = "25px"
  setTimeout(() => {
    e.target.src = "./copy.svg"
  }, 1000);
}else if(e.target.classList.contains("delete-img")){//deleting
  const appName = e.target.closest("tr").querySelector("td:nth-child(1)").textContent.trim();
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
          window.location.href = "/vault";
        } else {
          window.location.reload();
        }
      })
      .catch((err) => {
        console.log(`error from main js while deleting ${err}`);
      });
}else if(e.target.classList.contains("password")){
  //showing password
  if(e.target.textContent !== "••••••••")return e.target.textContent = "••••••••"
  const passwordID = e.target.dataset.id;
 fetch(`/showpassword/${passwordID}`).then((response)=>{
  if(!response.ok){
    throw new Error("failed to fetch password")
  }
  return response.json()
 }).then((data)=>{
  e.target.textContent = data.password
 }).catch((err)=>{
  console.log(`error from main js while showing password ${err}`);
 })
}
})
//searching
searchInput.addEventListener("input", () => {
  const input = searchInput.value.trim()
  fetch(`/search?query=${encodeURIComponent(input)}`).then((response)=>{
    if(!response.ok){
      throw new Error("failed to fetch data")
    }
    return response.json()
  }).then((data)=>{
    tbody.innerHTML = ""
    totalResults.textContent = data.total
    username.textContent = data.username
    data.data.forEach(el => {
      const date =  new Date(el.createdAt).toISOString().split("T")[0]
      const tr = document.createElement("tr")
tr.innerHTML =`
        <td class="px-10 py-4 text-white">
          
            <span >${el.appname}</span>
        </td>
        <td id="password" data-id="${el._id}" class="px-24 py-4 text-white cursor-pointer password">••••••••</td>
        <td class="text-white px-24 py-4">${date}</td>
        <td class="px-24 py-4 text-red-500 cursor-pointer hover:text-red-600">
          <div class="flex justify-center gap-4 items-center">
            <img  src="./copy.svg" alt="Copy" class="hover:bg-slate-400/50 transition duration-300 border-left-2 copy-img">
            <img src="./delete.png" alt="Delete" class="w-8 hover:bg-red-600/30 rounded-md transition duration-200 delete-img">
          </div>
        </td>
`
      tbody.appendChild(tr)   
      });
  }).catch((err)=>{
    console.log(`error from main js while searching ${err}`);
  })
})
/*
<tr>
        <td class="px-10 py-4 text-white">
          
            <span >${data.data[0].appname}</span>
        </td>
        <td id="password-hidden" class="px-24 py-4 text-white">${data.data[0].password}</td>
        <td class="text-white px-24 py-4">2024-01-01</td>
        <td class="px-24 py-4 text-red-500 cursor-pointer hover:text-red-600">
          <div class="flex justify-center gap-4 items-center">
            <img id="copy-img" src="./copy.svg" alt="Copy" class="hover:bg-slate-400/50 transition duration-300 border-left-2 ">
            <img id="delete-img" src="./delete.png" alt="Delete" class="w-8 hover:bg-red-600/30 rounded-md transition duration-200">
          </div>
        </td>
      </tr>
*/


