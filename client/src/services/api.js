export const API_URL=import.meta.env.VITE_API_URL||window.location.origin;
export async function fetchJson(path,signal){
  const response=await fetch(`${API_URL}${path}`,{signal:AbortSignal.any([signal,AbortSignal.timeout(10000)])});
  if(!response.ok){
    if(response.status===429)throw new Error('Too many requests. Wait a moment and retry.');
    throw new Error('The service is unavailable. Please try again.');
  }
  return response.json();
}
