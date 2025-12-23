import { useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './RichTextEditor.module.scss';

const cx = classNames.bind(styles);

function RichTextEditor({ value = '', onChange, placeholder = 'Nhập nội dung...' }) {
    const editorRef = useRef(null);
    const toolbarRef = useRef(null);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (onChange && editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const handleKeyDown = (e) => {
        // Ctrl+B for bold, Ctrl+I for italic
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault();
                execCommand('bold');
            } else if (e.key === 'i') {
                e.preventDefault();
                execCommand('italic');
            } else if (e.key === 'u') {
                e.preventDefault();
                execCommand('underline');
            }
        }
    };

    return (
        <div className={cx('rich-text-editor')}>
            <div ref={toolbarRef} className={cx('toolbar')}>
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('bold')}
                    title="In đậm (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('italic')}
                    title="In nghiêng (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('underline')}
                    title="Gạch chân (Ctrl+U)"
                >
                    <u>U</u>
                </button>
                <div className={cx('toolbar-separator')} />
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('formatBlock', '<h2>')}
                    title="Tiêu đề 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('formatBlock', '<h3>')}
                    title="Tiêu đề 3"
                >
                    H3
                </button>
                <div className={cx('toolbar-separator')} />
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('insertUnorderedList')}
                    title="Danh sách không đánh số"
                >
                    •
                </button>
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('insertOrderedList')}
                    title="Danh sách đánh số"
                >
                    1.
                </button>
                <div className={cx('toolbar-separator')} />
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => {
                        const url = prompt('Nhập URL:');
                        if (url) {
                            execCommand('createLink', url);
                        }
                    }}
                    title="Chèn link"
                >
                    🔗
                </button>
                <button
                    type="button"
                    className={cx('toolbar-btn')}
                    onClick={() => execCommand('removeFormat')}
                    title="Xóa định dạng"
                >
                    ✂️
                </button>
            </div>
            <div
                ref={editorRef}
                className={cx('editor')}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />
        </div>
    );
}

export default RichTextEditor;

