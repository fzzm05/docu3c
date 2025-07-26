import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import { FaChalkboardTeacher, FaChartLine, FaBookOpen } from 'react-icons/fa';
import { MdSupportAgent, MdAnalytics } from 'react-icons/md';

export default function Homepage() {
    return (
        <>
            {/* Hero Section */}
            <div className="pt-24 pb-20 my-10 px-4 md:px-16 flex flex-col md:flex-row items-center justify-center dark:bg-black">
                <div className="flex flex-col justify-center items-start font-semibold text-black dark:text-white tracking-widest">
                    <motion.h4
                        initial={{ x: -200, opacity: 0 }}
                        transition={{ type: 'spring', duration: 2 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-left text-3xl md:text-4xl font-extralight"
                    >
                        Maximize your score with the right strategy. <br />
                        Join <span className='font-bold'>TestOverseas</span> <br />
                        and start your prep for
                    </motion.h4>
                    <p className="mt-1 text-secondary font-semibold text-4xl md:text-5xl lg:text-7xl text-left">
                        <Typewriter
                            words={['GMAT', 'GRE', 'IELTS']}
                            loop={Infinity}
                            cursor
                            cursorStyle="|"
                            typeSpeed={70}
                            deleteSpeed={60}
                            delaySpeed={1000}
                        />
                    </p>
                    <motion.h4
                        initial={{ x: -200, opacity: 0 }}
                        transition={{ type: 'spring', duration: 2 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-left mt-1 text-3xl md:text-4xl font-extralight"
                    >
                        Your path to top scores starts here!
                    </motion.h4>
                    <div className="flex flex-wrap justify-start mt-10 md:mb-5 z-10">
                        <a
                            href="/signup"
                            className="bg-black dark:bg-white text-white dark:text-black py-3 px-4 mx-2 md:my-2 rounded-md text-lg"
                        >
                            SignUp
                        </a>
                        <a
                            href="/login"
                            className="bg-black dark:bg-white text-white dark:text-black py-3 px-4 mx-2 md:my-2 rounded-md text-lg"
                        >
                            LogIn
                        </a>
                    </div>
                </div>

                <div className="md:w-1/2 flex justify-center">
                    <img
                        src="/homepage1.png"
                        alt="Illustration"
                        className="w-3/4 md:w-4/5"
                    />
                </div>
            </div>

            {/* Features Section */}
            <section id="pricing" className="py-20 my-10 bg-gray-100 dark:bg-zinc-900 text-center">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-8">Why Choose TestOverseas?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                    <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-white dark:bg-black rounded-xl shadow-md">
                        <FaChalkboardTeacher className="text-4xl mb-4 mx-auto text-blue-600" />
                        <h3 className="text-xl font-semibold mb-2">Expert Mentorship</h3>
                        <p>Learn from certified experts who’ve helped 10,000+ students succeed.</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-white dark:bg-black rounded-xl shadow-md">
                        <FaBookOpen className="text-4xl mb-4 mx-auto text-blue-600" />
                        <h3 className="text-xl font-semibold mb-2">Personalized Study Plans</h3>
                        <p>We tailor your prep plan based on your strengths and improvement areas.</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-white dark:bg-black rounded-xl shadow-md">
                        <MdAnalytics className="text-4xl mb-4 mx-auto text-blue-600" />
                        <h3 className="text-xl font-semibold mb-2">Mock Tests & Analytics</h3>
                        <p>Track your performance with in-depth analytics and full-length mock tests.</p>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 my-10 bg-white dark:bg-black">
                <h2 className="text-3xl font-bold text-center text-black dark:text-white mb-8">What Our Students Say</h2>
                <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-100 dark:bg-zinc-800 p-6 rounded-lg shadow-md">
                        <p className="italic">"TestOverseas was a game changer for me. The personalized guidance and expert sessions helped me score 330+ in GRE!"</p>
                        <p className="mt-4 font-bold">— Anjali S.</p>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-gray-100 dark:bg-zinc-800 p-6 rounded-lg shadow-md">
                        <p className="italic">"I improved my IELTS score from 6.5 to 8 bands in just 2 months. Highly recommend their structured plan."</p>
                        <p className="mt-4 font-bold">— Rohit M.</p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 mt-10 bg-gray-100 dark:bg-zinc-900 text-center">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-8">Choose Your Plan</h2>
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                    <motion.div whileHover={{ scale: 1.05 }} className="p-8 bg-white dark:bg-black rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4">Basic</h3>
                        <p className="text-3xl font-semibold mb-4">₹4,999</p>
                        <ul className="text-left mb-6">
                            <li>✔ 1 Month Access</li>
                            <li>✔ 3 Full-Length Tests</li>
                            <li>✔ Limited Analytics</li>
                        </ul>
                        <a href="/signup" className="bg-blue-600 text-white py-2 px-6 rounded-md">Start Now</a>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} className="p-8 bg-white dark:bg-black rounded-xl shadow-lg border-4 border-blue-600">
                        <h3 className="text-2xl font-bold mb-4">Pro</h3>
                        <p className="text-3xl font-semibold mb-4">₹9,999</p>
                        <ul className="text-left mb-6">
                            <li>✔ 3 Months Access</li>
                            <li>✔ 10 Full-Length Tests</li>
                            <li>✔ Full Performance Analytics</li>
                            <li>✔ Weekly Strategy Calls</li>
                        </ul>
                        <a href="/signup" className="bg-blue-600 text-white py-2 px-6 rounded-md">Most Popular</a>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} className="p-8 bg-white dark:bg-black rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4">Premium</h3>
                        <p className="text-3xl font-semibold mb-4">₹14,999</p>
                        <ul className="text-left mb-6">
                            <li>✔ 6 Months Access</li>
                            <li>✔ Unlimited Tests</li>
                            <li>✔ Full Performance Analytics</li>
                            <li>✔ Dedicated Mentor Support</li>
                            <li>✔ Doubt Solving Sessions</li>
                        </ul>
                        <a href="/signup" className="bg-blue-600 text-white py-2 px-6 rounded-md">Enroll Today</a>
                    </motion.div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="py-20 bg-blue-600 text-white text-center">
                <h2 className="text-4xl font-bold mb-4">Ready to Begin Your Journey?</h2>
                <p className="text-xl mb-6">Join thousands of aspirants who trust TestOverseas to reach their dream scores.</p>
                <a
                    href="/signup"
                    className="inline-block bg-white text-blue-600 py-3 px-6 rounded-md font-semibold text-lg hover:bg-gray-100"
                >
                    Get Started Now
                </a>
            </section>

        </>
    );
}
