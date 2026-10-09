"use client";
import { useEffect,useState } from "react";
export function useDeliveryCharge(){const [delivery,setDelivery]=useState(450);useEffect(()=>{fetch("/api/store-config").then(r=>r.ok?r.json():null).then(v=>{if(v&&Number.isSafeInteger(v.deliveryCharge)&&v.deliveryCharge>=0)setDelivery(v.deliveryCharge)}).catch(()=>{});},[]);return delivery;}
