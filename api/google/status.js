function parseCookies(cookieHeader='') {

 return Object.fromEntries(
   cookieHeader
    .split(';')
    .map(x=>x.trim())
    .filter(Boolean)
    .map(x=>{
      const i=x.indexOf('=');
      return [
        x.slice(0,i),
        decodeURIComponent(x.slice(i+1))
      ];
    })
 );

}

export default async function handler(req,res){

 const cookies = parseCookies(
   req.headers.cookie || ''
 );

 const accessToken = cookies.google_access_token;

 if(!accessToken){

   return res.status(200).json({
     connected:false
   });

 }

 return res.status(200).json({
   connected:true,
   profile:{
     email:'Google connecté'
   }
 });

}