import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Warm cyberpunk theme colors
				cyber: {
					orange: '#ff6b35',
					red: '#ff4444',
					gold: '#ffd700',
					amber: '#ffbf00',
					copper: '#b87333',
					warm: '#ff8c42',
					dark: '#1a0f0a',
					darker: '#0f0804'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'glow-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 20px rgb(255 107 53 / 0.3), 0 0 40px rgb(255 107 53 / 0.1)' 
					},
					'50%': { 
						boxShadow: '0 0 30px rgb(255 107 53 / 0.5), 0 0 60px rgb(255 107 53 / 0.2)' 
					}
				},
				'neon-flicker': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'fade-in-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'float-1': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'10%': { opacity: '1' },
					'90%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(360deg)', opacity: '0' }
				},
				'float-2': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'15%': { opacity: '1' },
					'85%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(-360deg)', opacity: '0' }
				},
				'float-3': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'20%': { opacity: '1' },
					'80%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(180deg)', opacity: '0' }
				},
				'float-4': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'25%': { opacity: '1' },
					'75%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(-180deg)', opacity: '0' }
				},
				'float-5': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'30%': { opacity: '1' },
					'70%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(270deg)', opacity: '0' }
				},
				'float-6': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'35%': { opacity: '1' },
					'65%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(-270deg)', opacity: '0' }
				},
				'float-7': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'40%': { opacity: '1' },
					'60%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(90deg)', opacity: '0' }
				},
				'float-8': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'45%': { opacity: '1' },
					'55%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(-90deg)', opacity: '0' }
				},
				'float-9': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'50%': { opacity: '1' },
					'50%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(45deg)', opacity: '0' }
				},
				'float-10': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'12%': { opacity: '1' },
					'88%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(135deg)', opacity: '0' }
				},
				'float-11': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'18%': { opacity: '1' },
					'82%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(-135deg)', opacity: '0' }
				},
				'float-12': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'22%': { opacity: '1' },
					'78%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(225deg)', opacity: '0' }
				},
				'float-13': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'28%': { opacity: '1' },
					'72%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(-225deg)', opacity: '0' }
				},
				'float-14': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'33%': { opacity: '1' },
					'67%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(315deg)', opacity: '0' }
				},
				'float-15': {
					'0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
					'38%': { opacity: '1' },
					'62%': { opacity: '1' },
					'100%': { transform: 'translateY(-110vh) rotate(-315deg)', opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'neon-flicker': 'neon-flicker 1.5s ease-in-out infinite',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'float-1': 'float-1 25s linear infinite',
				'float-2': 'float-2 30s linear infinite 5s',
				'float-3': 'float-3 28s linear infinite 10s',
				'float-4': 'float-4 32s linear infinite 15s',
				'float-5': 'float-5 26s linear infinite 20s',
				'float-6': 'float-6 29s linear infinite 25s',
				'float-7': 'float-7 27s linear infinite 30s',
				'float-8': 'float-8 31s linear infinite 35s',
				'float-9': 'float-9 33s linear infinite 40s',
				'float-10': 'float-10 24s linear infinite 2s',
				'float-11': 'float-11 35s linear infinite 7s',
				'float-12': 'float-12 29s linear infinite 12s',
				'float-13': 'float-13 27s linear infinite 17s',
				'float-14': 'float-14 31s linear infinite 22s',
				'float-15': 'float-15 26s linear infinite 27s'
			},
			backgroundImage: {
				'cyber-grid': 'linear-gradient(rgba(255,107,53,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,53,0.1) 1px, transparent 1px)',
				'cyber-gradient': 'linear-gradient(135deg, #1a0f0a 0%, #2e1a1a 50%, #3e1616 100%)'
			},
			backgroundSize: {
				'cyber-grid': '50px 50px'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
