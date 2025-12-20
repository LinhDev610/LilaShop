import classNames from 'classnames/bind';
import styles from './Pagination.module.scss';
import iconLeftArrow from '../../../assets/icons/icon_leftarrow.png';
import iconRightArrow from '../../../assets/icons/icon_rightarrow.png';

const cx = classNames.bind(styles);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages < 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        // Simple pagination: show all or max 5? 
        // For simplicity and user request context "25 products per page", let's show window of pages.
        // Assuming not too many pages for now given 25/page, but robust logic is better.

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={cx('page-number', { active: i === currentPage })}
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div className={cx('pagination-container')}>
            <button
                className={cx('nav-btn', { disabled: currentPage === 1 })}
                onClick={handlePrevious}
                disabled={currentPage === 1}
            >
                <img src={iconLeftArrow} alt="Previous" className={cx('nav-icon')} />
            </button>

            <div className={cx('page-numbers')}>
                {renderPageNumbers()}
            </div>

            <button
                className={cx('nav-btn', { disabled: currentPage === totalPages })}
                onClick={handleNext}
                disabled={currentPage === totalPages}
            >
                <img src={iconRightArrow} alt="Next" className={cx('nav-icon')} />
            </button>
        </div>
    );
};

export default Pagination;
