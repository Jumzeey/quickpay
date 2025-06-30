import { ChangeEvent } from 'react';

type SwitchProps = {
    id: string;
    containerClassName?: string;
    contentClassName?: string;
    enabled: boolean;
    onChange: (event: ChangeEvent) => void;
}

const Switch: React.FC<SwitchProps> = ({ id, enabled, onChange, containerClassName, contentClassName }) => {
    return (
        <label className="inline-flex items-center cursor-pointer">
            <input
                id={id}
                type="checkbox"
                checked={enabled}
                onChange={onChange}
                className="sr-only peer"
            />
            <div className={`w-5 h-3 bg-[#005BB0] peer-checked:bg-green-500 rounded-full peer transition-colors duration-300 ${containerClassName}`} />
            <div className={`absolute size-2 bg-white rounded-full transform -translate-y-1 peer-checked:translate-x-full transition-transform duration-300 pointer-events-none ml-0.5 mt-2 ${contentClassName}`} />
        </label>
    );
}

export default Switch;