const Total = (props: { total: number }) => {
    const { total } = props
    return (
        <div className="pagination-total">
            <span>{total}</span> {total === 1 ? 'registro' : 'registros'}
        </div>
    )
}

export default Total
