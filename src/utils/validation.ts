
export const BAD_WORDS = [
    'puta', 'mierda', 'coño', 'verga', 'estupido', 'idiota', 'imbecil', 'marico', 'mamaguevo', 'joder',
    'culo', 'pendejo', 'cabron', 'zorra', 'maldito', 'bastardo', 'puto', 'loco', 'tarado'
];

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const hasBadWords = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return BAD_WORDS.some(word => lowerText.includes(word));
};

export const isValidName = (name: string): boolean => {
    // Min 2 chars, Max 50 chars.
    if (name.length < 2 || name.length > 50) return false;

    // Only letters and spaces (including accents and ñ)
    const nameRegex = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/;
    return nameRegex.test(name);
};

export const isValidPassword = (password: string): boolean => {
    // Min 6 characters
    return password.length >= 6;
};

export const isValidProductDescription = (description: string): boolean => {
    // Min 10 chars, Max 200 chars
    return description.length >= 10 && description.length <= 200;
}
