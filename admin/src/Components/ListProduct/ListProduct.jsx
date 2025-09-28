import React, { useState, useEffect } from 'react'
import './ListProduct.css'
import cross_icon from '../../assets/cross_icon.png' 

const ListProduct = () => {
    const [allproducts, setAllProducts] = useState([]);

    const fetchInfo = async () => {
        await fetch('http://localhost:4000/allproducts')
            .then((res) => res.json())
            .then((data) => {
                setAllProducts(data);
            });
    }

    // Call fetchInfo when the component mounts
    useEffect(() => {
        fetchInfo();
    }, []);

    const removeProduct = async (id) => {
        await fetch('http://localhost:4000/removeproduct', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id }),
        });
        // After successful removal, re-fetch the list to update the UI
        await fetchInfo();
    }

    return (
        <div className='list-product'>
            <h1>All Products List</h1>
            <div className="listproduct-format-main">
                <p>Products</p>
                <p>Title</p>
                <p>Old Price</p>
                <p>New Price</p>
                <p>Category</p>
                <p>Remove</p>
            </div>
            <div className="listproduct-allproducts">
                <hr />
                {allproducts.map((product, index) => {
                    return (<>  
                        
                        <div key={index} className="listproduct-format-main listproduct-format">
                            <img 
                                src={product.image} 
                                alt="" 
                                className="listproduct-product-icon" 
                            />
                            <p>{product.name}</p>
                            <p>${product.old_price}</p>
                            <p>${product.new_price}</p>
                            <p>{product.category}</p>
                            
                            {/* Remove Icon: Updated to match the provided snippet structure and include the necessary onClick handler */}
                            <img 
                                onClick={() => { removeProduct(product.id) }} 
                                className='listproduct-remove-icon' 
                                src={cross_icon} 
                                alt="Remove"
                            />
                        </div>
                        <hr />
                        </>
                    );
                })}
            </div>
        </div>
    )
}

export default ListProduct