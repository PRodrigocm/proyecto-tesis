interface SelectOption {
  id: string
  nombre: string
}

interface SelectProps {
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: SelectOption[]
  error?: string
  label: string
  placeholder: string
  disabled?: boolean
  loading?: boolean
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  error,
  label,
  placeholder,
  disabled = false,
  loading = false,
  className = ''
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-black ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <option value="" className="text-black">{loading ? 'Cargando...' : placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id} className="text-black">
            {option.nombre}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
