'use client'
import { pixelify_sans } from '@/app/fonts';
import { useCharacterSelect } from '@/contexts/CharacterSelectContext';

function CreateCharacterButton() {
    const { setIsOpen } = useCharacterSelect();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
    };

    return (
        <button
            onClick={handleClick}
            type="button"
            className={`${pixelify_sans.className} bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded cursor-pointer`}
        >
            Create Character
        </button>
    );
}

export default CreateCharacterButton; 