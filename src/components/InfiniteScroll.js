import React from "react";
import PropTypes from "prop-types";

export class InfiniteScroll extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            itemsToShow: props.initialCount || 10,
        };
        this.triggerRef = React.createRef();
        this.observer = null;
    }

    componentDidMount() {
        this.observer = new IntersectionObserver(
            (entries) => {
                // Получаем первый наблюдаемый элемент
                const entry = entries[0];
                if (entry.isIntersecting) {
                    this.loadMoreItems();
                }
            },
            {
                root: null, // viewport браузера
                rootMargin: '0px',
                threshold: 0.1, // срабатывание, когда 10% элемента видно
            }
        );

        if (this.triggerRef.current) {
            this.observer.observe(this.triggerRef.current);
        }
    }

    componentDidUpdate() {
        // Если после обновления компонента триггерный элемент уже есть в DOM,
        // убедимся, что он наблюдается.
        if (this.triggerRef.current && this.observer) {
            this.observer.observe(this.triggerRef.current);
        }
    }

    componentWillUnmount() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    loadMoreItems() {
        const {items, step} = this.props;
        const {itemsToShow} = this.state;
        if (itemsToShow < items.length) {
            this.setState(
                {itemsToShow: itemsToShow + (step || 10)},
                () => {
                    // Чтобы избежать срабатывания сразу несколько раз, можно сначала сбросить наблюдение,
                    // а затем вновь установить наблюдение на триггерный элемент.
                    if (this.triggerRef.current && this.observer) {
                        this.observer.unobserve(this.triggerRef.current);
                        this.observer.observe(this.triggerRef.current);
                    }
                }
            );
        }
    }

    render() {
        const {items, renderItem} = this.props;
        const itemsToRender = items.slice(0, this.state.itemsToShow);
        return (
            <React.Fragment>
                {itemsToRender.map((item, index) => renderItem(item, index))}
                {/* Невидимый триггерный элемент */}
                <div ref={this.triggerRef} style={{height: '1px'}}/>
            </React.Fragment>
        );
    }
}

InfiniteScroll.defaultProps = {
    items: [],
    initialCount: 50,
    step: 10,
    renderItem: (value, index) => {
        return value;
    }
};

InfiniteScroll.propTypes = {
    items: PropTypes.array,
    initialCount: PropTypes.number,
    step: PropTypes.number,
    renderItem: PropTypes.func
};