//getting elements 
const form = document.getElementById("form") 
const codeInput = document.getElementById("code") 
const error = document.getElementById("error") 

form.addEventListener("submit",async(e)=>{
    e.preventDefault();
    const code = codeInput.value;
    error.textContent = "";
    if(!code || code.length !== 6){
        error.textContent = "Please enter a valid 6-digit code";
        return;
    }
    try{
        const res = await fetch("/verifyDevice",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({code})
        })
        const data = await res.json();
        if(data.success){
            window.location.href = "/"
            
        }else{
            error.textContent = data.message;
        }
    }catch(err){
        console.log(`error while verifying code ${err}`)
    }
})