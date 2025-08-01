import { useState } from 'react';
import React,{createContext} from "react";
import all_product from '../Components/Assets/all_product';
export const ShopContext = createContext(null);
const getDefaultCart = ()=>{
    let cart = [];
    for (let index = 0; index < 300 + 1; index++) {
         cart[index]=0;
    }
    return cart;
}
const ShopContextProvider = (props)=>{
    // const [all_product,setAll_product] = useState([]);
    const [cartItems,SetCartItems] = useState(getDefaultCart());
    // useEffect(()=>{
    //        fetch('http://localhost:4000/allproducts').then((response)=>{
    //         response.json().then((data)=>setAll_product(data))
    //        })
    // },[]);
    const addToCart = (itemId) =>{
        SetCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}))
        console.log(cartItems);
    }
    const removefromCart = (itemId) =>{
        SetCartItems((prev)=>({...prev,[itemId]:prev[itemId]-1}))
    }
    const getTotalCartAmount = () =>{
        let totalAmount = 0;
        for(const item in cartItems)
        {
            if(cartItems[item]>0)
            {
                let itemInfo = all_product.find((product)=>product.id===Number(item));
                totalAmount += itemInfo.new_price * cartItems[item];
            }
            
        }
        return totalAmount;
    }
    const getTotalCartItems = () =>{
        let totalItem = 0;
        for(const item in cartItems)
        {
            if(cartItems[item]>0)
            {
                totalItem += cartItems[item];
            }
        }
        return totalItem;
    }
    const contextValue = {getTotalCartItems,getTotalCartAmount,all_product,cartItems,addToCart,removefromCart};
    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
            </ShopContext.Provider>
    )
}
export default ShopContextProvider;