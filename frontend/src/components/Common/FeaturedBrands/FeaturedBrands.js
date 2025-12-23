import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './FeaturedBrands.module.scss';

const cx = classNames.bind(styles);

// TODO: Replace with real data from API - Extract unique brands from products
const brands = [
    { id: 1, name: "L'Oréal", logo: '/brands/loreal.png' },
    { id: 2, name: 'Innisfree', logo: '/brands/innisfree.png' },
    { id: 3, name: 'The Body Shop', logo: '/brands/bodyshop.png' },
    { id: 4, name: 'Maybelline', logo: '/brands/maybelline.png' },
    { id: 5, name: 'Laneige', logo: '/brands/laneige.png' },
    { id: 6, name: 'Clinique', logo: '/brands/clinique.png' },
    { id: 7, name: 'Estée Lauder', logo: '/brands/esteelauder.png' },
    { id: 8, name: 'Sulwhasoo', logo: '/brands/sulwhasoo.png' }
];

function FeaturedBrands({ products = [] }) {
    // Luôn hiển thị danh sách brand cố định, không phụ thuộc vào products
    const displayBrands = brands;

    return (
        <section className={cx('brandsSection')}>
            <h2 className={cx('sectionTitle')}>THƯƠNG HIỆU NỔI BẬT</h2>
            <div className={cx('brandsGrid')}>
                {displayBrands.map((brand) => (
                    <Link
                        key={brand.id}
                        to={`/search?q=${encodeURIComponent(brand.name)}`}
                        className={cx('brandItem')}
                    >
                        {brand.logo ? (
                            <img
                                src={brand.logo}
                                alt={brand.name}
                                className={cx('brandLogo')}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className={cx('brandLogo', 'brandLogoPlaceholder')}>
                                {brand.name.charAt(0)}
                            </div>
                        )}
                        <span className={cx('brandName')}>{brand.name}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default FeaturedBrands;

