// components/dashboard/Wishlist.jsx
import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        setLoading(true);
        const data = await userService.getWishlist();
        setWishlist(data.wishlist || []);
        setLoading(false);
    };

    const removeFromWishlist = async (productId) => {
        await userService.removeFromWishlist(productId);
        loadWishlist();
    };

    if (loading) return <div className="loading">Loading wishlist...</div>;

    return (
        <div className="dashboard-wishlist">
            <div className="section-header">
                <h2>❤️ My Wishlist</h2>
                <p>{wishlist.length} items saved</p>
            </div>

            {wishlist.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">❤️</div>
                    <h3>Your wishlist is empty</h3>
                    <p>Start adding items you love!</p>
                    <button className="shop-now-btn">Shop Now</button>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlist.map(productId => (
                        <div key={productId} className="wishlist-card">
                            <img src={`https://via.placeholder.com/200?text=${productId}`} alt={productId} />
                            <h4>Product {productId}</h4>
                            <p className="price">$49.99</p>
                            <div className="card-actions">
                                <button className="add-to-cart">Add to Cart</button>
                                <button className="remove-btn" onClick={() => removeFromWishlist(productId)}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
