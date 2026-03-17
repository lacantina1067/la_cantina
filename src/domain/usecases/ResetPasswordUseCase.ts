import { AuthRepository } from '../repositories/AuthRepository';

export class ResetPasswordUseCase {
    constructor(private authRepository: AuthRepository) { }

    async execute(email: string): Promise<void> {
        if (!email || !email.includes('@')) {
            throw new Error('Por favor ingresa un correo electrónico válido');
        }
        return await this.authRepository.resetPassword(email);
    }
}
