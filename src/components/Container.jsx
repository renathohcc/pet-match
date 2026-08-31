function Container({ children, className = '' }) {
  return <div className={`mx-auto max-w-[1180px] px-7 ${className}`}>{children}</div>
}

export default Container
