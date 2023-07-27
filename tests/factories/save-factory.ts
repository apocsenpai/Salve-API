import { prisma } from '@/config/database'
import { faker } from '@faker-js/faker'
import {
	createAddressWithoutNickname,
	generateAddressWithInvalidCepFormat,
	generateDistantValidAddress,
	generateValidAddress,
} from './address-factory'
import { SaveCategory } from '@prisma/client'
import { createProfile, createUser, generateValidUser } from './user-factory'
import { Address } from '@/utils/interfaces/addresses'

export function validNearbySavesQueryParams() {
	const latitude = (-22.757629).toString()
	const longitude = (-43.446023).toString()
	const range = (2000).toString()

	return new URLSearchParams({ latitude, longitude, range }).toString()
}

export function invalidNearbySavesQueryParams() {
	const latitude = faker.lorem.word()
	const longitude = faker.lorem.word()
	const range = faker.lorem.word()

	return new URLSearchParams({ latitude, longitude, range }).toString()
}

export async function createSave(
	profileId: number | null = null,
	address: Partial<Address> = generateValidAddress()
) {
	let currentProfileId = profileId

	if (!profileId) {
		const validUser = generateValidUser()

		const user = await createUser(validUser)

		currentProfileId = (await createProfile(user.id)).id
	}

	const categories = await getSaveCategories()

	const randomCategory = getRandomArrayElement(categories)

	const addressId = await createAddressWithoutNickname(address)

	return prisma.save.create({
		data: {
			description: faker.commerce.product(),
			requester: {
				connect: {
					id: currentProfileId,
				},
			},
			address: {
				connect: {
					id: addressId,
				},
			},
			category: {
				connect: {
					id: randomCategory.id,
				},
			},
		},
	})
}

export async function createNearbySave() {
	return createSave()
}

export async function createRequestedInProgressSave(profileId: number) {
	const validUser = generateValidUser()

	const user = await createUser(validUser)

	const providerId = (await createProfile(user.id)).id

	const { id: saveId } = await createSave(profileId)

	return prisma.save.update({
		where: {
			id: saveId,
		},
		data: {
			status: 'IN_PROGRESS',
			provider: {
				connect: {
					id: providerId,
				},
			},
		},
	})
}

export async function createRequestedSave(profileId: number) {
	return createSave(profileId)
}

export async function createProvidedSave(providerId: number) {
	const { id: saveId } = await createSave(null)

	return prisma.save.update({
		where: {
			id: saveId,
		},
		data: {
			provider: {
				connect: {
					id: providerId,
				},
			},
		},
	})
}

export async function createInProgressSave() {
	const { id: saveId } = await createSave(null)

	return prisma.save.update({
		where: {
			id: saveId,
		},
		data: {
			status: 'IN_PROGRESS',
		},
	})
}

export async function createDistantSave() {
	return createSave(null, generateDistantValidAddress())
}

export async function getSaveCategories(): Promise<Array<SaveCategory>> {
	return prisma.saveCategory.findMany({})
}

export async function generateValidSaveBody() {
	const categories = await getSaveCategories()

	const randomCategory = getRandomArrayElement(categories)

	return {
		description: faker.commerce.product(),
		categoryId: randomCategory.id,
		cost: randomCategory.cost,
		address: generateValidAddress(),
	}
}

export async function generateSaveBodyWithInvalidCep() {
	const categories = await getSaveCategories()

	const randomCategory = getRandomArrayElement(categories)

	return {
		description: faker.commerce.product(),
		categoryId: randomCategory.id,
		cost: randomCategory.cost,
		address: generateAddressWithInvalidCepFormat(),
	}
}

export function generateRandomRating() {
	return { rating: Math.floor(Math.random() * 5) + 1 }
}

function getRandomArrayElement(array: Array<SaveCategory>) {
	return array[Math.floor(Math.random() * array.length)]
}
