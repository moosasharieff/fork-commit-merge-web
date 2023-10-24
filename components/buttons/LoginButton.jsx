/* eslint-disable @next/next/no-html-link-for-pages */
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession, signIn, signOut } from 'next-auth/react'
import { fetchGitHubUsername } from '../../utils/fetchClosedPullRequests'

async function fetchStoredPullRequests(username) {
  const res = await fetch(`/api/getStoredPullRequests?username=${username}`)
  const data = await res.json()

  return data
}

export default function LoginButton() {
  const { data: session } = useSession()
  const [pullRequests, setPullRequests] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isConsentGiven, setConsentGiven] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        setIsLoading(true)
        try {
          const username = await fetchGitHubUsername(session.user.email)
          const storedPRs = await fetchStoredPullRequests(username)
          setPullRequests(storedPRs.pullRequests || [])
          const response = await axios.get(
            `/api/closedPullRequests?username=${username}`
          )
          setPullRequests(response.data)
        } catch (error) {
          console.error('Error:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchData()
  }, [session])

  const handleConsentChange = () => {
    setConsentGiven(!isConsentGiven)
  }

  const handleSignIn = async () => {
    if (!isConsentGiven) {
      alert('You must agree to the Privacy Policy to proceed.')
      return
    }

    setIsSigningIn(true)
    try {
      await signIn('github')
    } catch (error) {
      console.error('Sign in failed', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const size = 190

  if (session?.user) {
    return (
      <div className='text-center text-slate-50'>
        <div className='bg-primary flex flex-col-reverse items-center justify-between rounded-lg border px-4 py-2 shadow-lg md:flex-row'>
          <div className='md:mr-10'>
            <h2 className='mb-10 mt-6 text-4xl font-extrabold'>
              {session.user.name || 'User'}
            </h2>

            <p className='my-5'>{session.user.email}</p>
          </div>
          <div
            style={{
              borderRadius: '50%',
              overflow: 'hidden',
              width: size,
              height: size
            }}
            className='mb-6 md:mb-0'
          >
            <Image
              src={session.user.image}
              alt='User avatar'
              width={size}
              height={size}
            />
          </div>
        </div>

        {isLoading && (
          <div className='flex h-[200px] items-center justify-center'>
            <div className='spinner'></div>
          </div>
        )}

        {pullRequests.length > 0 && (
          <div className='py-4'>
            <hr className='my-6' />
            <h3 className='py-6 text-2xl'>
              Successfully Merged Pull Requests:
            </h3>
            <table className='min-w-full bg-slate-900'>
              <thead>
                <tr>
                  <th className='border-b border-gray-200 bg-gray-900 px-4 py-2 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-100'>
                    Title
                  </th>
                  <th className='border-b border-gray-200 bg-gray-900 px-4 py-2 text-left text-xs font-medium uppercase leading-4 tracking-wider text-gray-100'>
                    Issue
                  </th>
                </tr>
              </thead>
              <tbody>
                {pullRequests.map((pr, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}
                  >
                    <td className='whitespace-no-wrap px-4 py-4 text-sm leading-5 text-gray-100'>
                      {pr.title}
                    </td>
                    <td className='whitespace-no-wrap px-4 py-4 text-sm leading-5 text-gray-100'>
                      {pr.issue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className='my-8 rounded-md border border-transparent bg-gray-800 px-6 py-4 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <>
      <div className='text-center text-slate-50'>
        <div>
          <h2 className='mb-10 mt-6 text-center text-3xl font-extrabold text-slate-50'>
            Sign in with GitHub
          </h2>
        </div>
        <div className='consent-checkbox'>
          <input
            type='checkbox'
            id='consentCheckbox'
            checked={isConsentGiven}
            onChange={handleConsentChange}
          />
          <label htmlFor='consentCheckbox' className='pl-2'>
            I agree to the{' '}
            <a
              href='/privacy-policy'
              rel='noopener noreferrer'
              className='text-blue-400 hover:underline'
            >
              Privacy Policy
            </a>
          </label>
        </div>
        <button
          onClick={handleSignIn}
          className='my-6 inline-flex items-center space-x-2 rounded-md border border-transparent bg-gray-800 px-6 py-4 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
        >
          {isSigningIn ? (
            <div className='spinner'></div>
          ) : (
            <>
              <svg
                role='img'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
                fill='currentColor'
                width='24'
                height='24'
                className='mr-2'
              >
                <title>GitHub icon</title>
                <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.6-.015 2.885-.015 3.285 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'></path>
              </svg>
              LOGIN
            </>
          )}
        </button>
      </div>
    </>
  )
}
