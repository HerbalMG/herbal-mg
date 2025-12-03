import ProfileForm from '../components/ProfileForm'

const UserProfile = () => {
  return (
    <div className="min-h-screen">
      <header className="text-black p-4 text-center text-2xl sm:text-3xl md:text-4xl font-bold">
        Customer Profile
      </header>
      <main>
        <ProfileForm />
      </main>
    </div>
  )
}

export default UserProfile