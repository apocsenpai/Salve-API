import { faker } from '@faker-js/faker'
import httpStatus from 'http-status'
import supertest from 'supertest'
import {
	createAddress,
	createProfile,
	createUser,
	generateCredentialsWithInvalidLogin,
	generateValidCredentials,
	generateValidUser,
	getTokenData,
} from '../factories'
import { cleanDb } from '../helpers'
import app, { init } from '@/app'
import { TokenPayload } from '@/utils/interfaces/auth'

beforeAll(async () => {
	await init()
})

beforeEach(async () => {
	await cleanDb()
})

const server = supertest(app)

describe('POST /auth/sign-in', () => {
	it('should respond with status 422 when body is not given', async () => {
		const response = await server.post('/auth/sign-in')

		expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY)
	})

	it('should respond with status 422 when body is not valid', async () => {
		const invalidBody = { [faker.lorem.word()]: faker.lorem.word() }

		const response = await server.post('/auth/sign-in').send(invalidBody)

		expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY)
	})

	describe('when body is valid', () => {
		it('should respond with status 200 and token - without profile or address - when success', async () => {
			const validUser = generateValidUser()

			await createUser(validUser)

			const body = generateValidCredentials(validUser.email, validUser.password)

			const response = await server.post('/auth/sign-in').send(body)

			const { username, hasProfile, hasAddress } = (await getTokenData(
				response.body.token
			)) as TokenPayload

			expect(username).toEqual(validUser.username)
			expect(hasProfile).toEqual(false)
			expect(hasAddress).toEqual(false)
		})

		it('should respond with status 200 and token - with only profile - when success', async () => {
			const validUser = generateValidUser()

			const createdUser = await createUser(validUser)

			await createProfile(createdUser.id)

			const body = generateValidCredentials(validUser.email, validUser.password)

			const response = await server.post('/auth/sign-in').send(body)

			const { username, hasProfile, hasAddress } = (await getTokenData(
				response.body.token
			)) as TokenPayload

			expect(username).toEqual(validUser.username)
			expect(hasProfile).toEqual(true)
			expect(hasAddress).toEqual(false)
		})

		it('should respond with status 200 and token - with profile and address - when success', async () => {
			const validUser = generateValidUser()

			const createdUser = await createUser(validUser)

			const { id: profileId } = await createProfile(createdUser.id)

			await createAddress(profileId)

			const body = generateValidCredentials(validUser.email, validUser.password)

			const response = await server.post('/auth/sign-in').send(body)

			const { username, hasProfile, hasAddress } = (await getTokenData(
				response.body.token
			)) as TokenPayload

			expect(username).toEqual(validUser.username)
			expect(hasProfile).toEqual(true)
			expect(hasAddress).toEqual(true)
		})

		it('should respond with status 401 when username doesnt exists', async () => {
			const validUser = generateValidUser()

			await createUser(validUser)

			const body = generateCredentialsWithInvalidLogin(
				faker.internet.displayName(),
				validUser.password
			)

			const response = await server.post('/auth/sign-in').send(body)

			expect(response.status).toBe(httpStatus.UNAUTHORIZED)
		})

		it('should respond with status 401 when email doesnt exists', async () => {
			const validUser = generateValidUser()

			await createUser(validUser)

			const body = generateCredentialsWithInvalidLogin(
				faker.internet.email(),
				validUser.password
			)

			const response = await server.post('/auth/sign-in').send(body)

			expect(response.status).toBe(httpStatus.UNAUTHORIZED)
		})

		it('should respond with status 401 when password is wrong', async () => {
			const validUser = generateValidUser()

			await createUser(validUser)

			const body = generateCredentialsWithInvalidLogin(
				validUser.email,
				faker.internet.password()
			)

			const response = await server.post('/auth/sign-in').send(body)

			expect(response.status).toBe(httpStatus.UNAUTHORIZED)
		})
	})
})
