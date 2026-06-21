import { prisma } from "db";
import { jwt } from '@elysiajs/jwt'

export abstract class AuthService {
    static async signup(email: string, password: string): Promise<string> {
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? "ADMIN" : "USER";

        const user = await prisma.user.create({
            data: {
                email,
                password: await Bun.password.hash(password),
                role
            }
        })
        return user.id.toString()
    }
    static async signin(email: string, password: string): Promise<{correctCredentials: boolean, userId?: string, role?: string}> {
        const user = await prisma.user.findFirst({
            where: {
                email
            }
        })

        if (!user) {
            return { correctCredentials: false };
        }

        if (!await Bun.password.verify(password, user.password)) {
            return { correctCredentials: false };
        }

        return { correctCredentials: true, userId: user.id.toString(), role: user.role };
    } 

    static async getUserDetails(id: number) {
        const user = await prisma.user.findFirst({
            where: {
                id
            },
            select: {
                email: true,
                balance: true,
                role: true
            }
        });

        if (!user) return null;

        return {
            email: user.email,
            balance: user.balance.toString(),
            role: user.role
        };
    }
    
    static async updatePassword(id: number, newPassword: string): Promise<void> {
        await prisma.user.update({
            where: {
                id
            },
            data: {
                password: await Bun.password.hash(newPassword)
            }
        });
    }
}
