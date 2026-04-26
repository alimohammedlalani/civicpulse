import { z } from 'zod'

export const needFormSchema = z.object({
  description: z.string().min(10, 'Please describe your need in at least 10 characters').max(1000, 'Description too long'),
  category: z.string().min(1, 'Please select a category'),
  urgency: z.string().min(1, 'Please select urgency level'),
  quantity: z.number().min(1).max(9999).optional().default(1),
  location_hint: z.string().min(1, 'Please provide a location'),
  location_coords: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  anonymous: z.boolean().optional().default(false),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const onboardingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  location: z.string().min(3, 'Please enter your location'),
  coords: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  availability: z.string().min(1, 'Please select your availability'),
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  other_skills: z.string().optional(),
  experience_level: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().optional(),
})

export const resolutionSchema = z.object({
  outcome: z.string().min(5, 'Please describe the outcome'),
  resources_used: z.string().optional(),
  duration_minutes: z.number().min(1).optional(),
  people_helped: z.number().min(1).optional(),
  notes: z.string().optional(),
})

